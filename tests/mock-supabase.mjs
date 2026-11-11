// Local stand-in for Supabase's REST API (PostgREST), running on a real in-memory Postgres (PGlite) that has
// supabase/schema.sql applied. It lets the website and the database rules be tested end to end without a Supabase account.
// Supports only what this site uses: select/insert/update/upsert with eq/neq/in/is/not/gte/lte filters, order, limit, and rpc().
// Run:  node tests/mock-supabase.mjs   (listens on http://127.0.0.1:54321)
import http from "node:http";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

export async function startMock({ port = 54321, seed = false } = {}) {
  const db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(fs.readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8"));
  if (seed) await db.exec(fs.readFileSync(new URL("./seed.sql", import.meta.url), "utf8")).catch(() => {});
  const tables = new Set((await db.query("select table_name from information_schema.tables where table_schema='public'")).rows.map((r) => r.table_name));
  const funcs = new Set((await db.query("select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'")).rows.map((r) => r.proname));
  const ident = (s) => { if (!/^[a-z_][a-z0-9_]*$/i.test(s)) throw new Error("bad identifier " + s); return '"' + s + '"'; };
  const json = (v) => JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? Number(x) : x));
  const RESERVED = new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]);

  function where(params, args) {
    const parts = [];
    for (const [k, raw] of params) {
      if (RESERVED.has(k)) continue;
      let v = raw, neg = false;
      if (v.startsWith("not.")) { neg = true; v = v.slice(4); }
      const dot = v.indexOf("."); const op = v.slice(0, dot), val = v.slice(dot + 1);
      const col = ident(k); let c;
      if (op === "eq") { args.push(val); c = `${col} = $${args.length}`; }
      else if (op === "neq") { args.push(val); c = `${col} <> $${args.length}`; }
      else if (op === "gte") { args.push(val); c = `${col} >= $${args.length}`; }
      else if (op === "lte") { args.push(val); c = `${col} <= $${args.length}`; }
      else if (op === "lt") { args.push(val); c = `${col} < $${args.length}`; }
      else if (op === "gt") { args.push(val); c = `${col} > $${args.length}`; }
      else if (op === "is") c = `${col} is ${val === "null" ? "null" : val}`;
      else if (op === "in") {
        const list = val.replace(/^\(|\)$/g, "").split(",").map((x) => x.replace(/^"|"$/g, ""));
        const ph = list.map((x) => { args.push(x); return `$${args.length}`; }); c = `${col} in (${ph.join(",")})`;
      } else throw new Error("unsupported operator " + op);
      parts.push(neg ? `not (${c})` : c);
    }
    return parts.length ? " where " + parts.join(" and ") : "";
  }
  const cols = (sel) => (!sel || sel === "*") ? "*" : sel.split(",").map((c) => ident(c.trim())).join(",");
  const orderBy = (o) => o ? " order by " + o.split(",").map((p) => { const [c, d] = p.split("."); return ident(c) + (d === "desc" ? " desc" : " asc"); }).join(",") : "";

  const server = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const bodyText = Buffer.concat(chunks).toString(); const url = new URL(req.url, "http://x");
    const reply = (status, body, extra = {}) => { res.writeHead(status, { "Content-Type": "application/json", ...extra }); res.end(body === undefined ? "" : json(body)); };
    try {
      const m = url.pathname.match(/^\/rest\/v1\/(.+)$/); if (!m) return reply(404, { message: "not found" });
      const name = m[1].replace(/^rpc\//, ""); const isRpc = m[1].startsWith("rpc/");
      const single = (req.headers.accept || "").includes("vnd.pgrst.object");
      const wantRep = (req.headers.prefer || "").includes("return=representation");
      const args = [];

      if (isRpc) {
        if (!funcs.has(name)) return reply(404, { message: "no such function " + name });
        const body = bodyText ? JSON.parse(bodyText) : {};
        const names = Object.keys(body); const ph = names.map((n, i) => `${ident(n)} => $${i + 1}`).join(", ");
        const vals = names.map((n) => (body[n] !== null && typeof body[n] === "object" ? JSON.stringify(body[n]) : body[n]));
        const r = await db.query(`select ${ident(name)}(${ph}) as r`, vals);
        return reply(200, r.rows[0].r);
      }
      if (!tables.has(name)) return reply(404, { message: "no such table " + name });
      const T = ident(name);
      let rows;
      if (req.method === "GET" || req.method === "HEAD") {
        let sql = `select ${cols(url.searchParams.get("select"))} from ${T}` + where(url.searchParams, args) + orderBy(url.searchParams.get("order"));
        if (url.searchParams.get("limit")) sql += ` limit ${parseInt(url.searchParams.get("limit"), 10)}`;
        if (url.searchParams.get("offset")) sql += ` offset ${parseInt(url.searchParams.get("offset"), 10)}`;
        rows = (await db.query(sql, args)).rows;
      } else if (req.method === "POST") {
        const body = JSON.parse(bodyText); const list = Array.isArray(body) ? body : [body];
        const keys = Array.from(new Set(list.flatMap((o) => Object.keys(o))));
        const vals = []; const tuples = list.map((o) => "(" + keys.map((k) => { const v = o[k]; vals.push(v !== null && typeof v === "object" ? JSON.stringify(v) : v ?? null); return `$${vals.length}`; }).join(",") + ")");
        let sql = `insert into ${T} (${keys.map(ident).join(",")}) values ${tuples.join(",")}`;
        if ((req.headers.prefer || "").includes("merge-duplicates")) {
          const conflict = url.searchParams.get("on_conflict") || (name === "settings" ? "key" : "id");
          sql += ` on conflict (${conflict.split(",").map(ident).join(",")}) do update set ${keys.filter((k) => !conflict.split(",").includes(k)).map((k) => `${ident(k)} = excluded.${ident(k)}`).join(",")}`;
        }
        rows = (await db.query(sql + " returning *", vals)).rows;
      } else if (req.method === "PATCH") {
        const body = JSON.parse(bodyText); const keys = Object.keys(body);
        const sets = keys.map((k) => { const v = body[k]; args.push(v !== null && typeof v === "object" ? JSON.stringify(v) : v); return `${ident(k)} = $${args.length}`; });
        rows = (await db.query(`update ${T} set ${sets.join(",")}` + where(url.searchParams, args) + " returning *", args)).rows;
      } else return reply(405, { message: "method" });

      if (single) { if (rows.length !== 1) return reply(406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `Results contain ${rows.length} rows` }); return reply(200, rows[0]); }
      if (req.method === "POST" || req.method === "PATCH") return wantRep ? reply(req.method === "POST" ? 201 : 200, rows) : reply(req.method === "POST" ? 201 : 204);
      return reply(200, rows);
    } catch (e) {
      const msg = String(e.message || e);
      const code = e.code === "23505" ? "23505" : "P0001";
      return reply(code === "23505" ? 409 : 400, { code, message: msg, details: null, hint: null });
    }
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  return { db, server, url: `http://127.0.0.1:${port}`, close: () => new Promise((r) => server.close(r)) };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("mock-supabase.mjs")) {
  const m = await startMock();
  console.log("mock supabase listening on", m.url);
}
