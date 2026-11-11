// End-to-end test in a real browser (Chrome via puppeteer-core) against the running site + the local Supabase stand-in.
//   1) node tests/mock-supabase.mjs        2) start the site on :3100 with SUPABASE_URL=http://127.0.0.1:54321 ...
//   3) node tests/e2e.mjs                  (needs: npm i puppeteer-core)
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const SITE = process.env.SITE || "http://localhost:3100";
const REST = process.env.REST || "http://127.0.0.1:54321/rest/v1";
const CHROME = process.env.CHROME || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = process.env.OUT || ".";
const ADMIN = { email: "owner@test.com", password: "TestPassword-12345" };

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log("  ✔", msg); } else { fail++; console.log("  ✖ FAIL:", msg); } };
const get = async (path) => (await fetch(`${REST}/${path}`)).json();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const money = (n) => "Rs. " + n.toLocaleString("en-PK");

const PACKAGES = [
  { name: "Character · Group · Monthly", q: "program=character-grooming&type=group&term=monthly", price: 6000, age: 9 },
  { name: "Character · Group · 3 Months", q: "program=character-grooming&type=group&term=3m", price: 16500, age: 6 },
  { name: "Character · Group · 6 Months", q: "program=character-grooming&type=group&term=6m", price: 30000, age: 13 },
  { name: "Character · Private · Monthly", q: "program=character-grooming&type=private&term=monthly", price: 13000, age: 10 },
  { name: "Character · Private · 3 Months", q: "program=character-grooming&type=private&term=3m", price: 36000, age: 14 },
  { name: "Character · Private · 6 Months", q: "program=character-grooming&type=private&term=6m", price: 69000, age: 7 },
  { name: "Tuition · Group · 4 weeks", q: "program=academic-tuition&type=group", price: 6000, age: 11, tuition: true },
  { name: "Tuition · Private · 4 weeks", q: "program=academic-tuition&type=private", price: 15999, age: 12, tuition: true },
];

const clickText = async (page, text, sel = "button, a") => {
  const h = await page.evaluateHandle((t, s) => [...document.querySelectorAll(s)].find((e) => e.textContent.trim() === t || e.textContent.trim().startsWith(t)), text, sel);
  const el = h.asElement(); if (!el) throw new Error("no element with text: " + text);
  await el.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); await el.click();
};
const waitText = async (page, t, timeout = 45000) => {
  try { await page.waitForFunction((x) => document.body.innerText.includes(x), { timeout }, t); }
  catch (e) {
    const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 500)).catch(() => "?");
    throw new Error(`waiting for "${t}" on ${page.url()} failed. Page says: ${txt} | browser errors: ${(page.errors || []).join(" | ")}`);
  }
};

async function newPage(browser, mobile) {
  const page = await browser.newPage();
  await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1440, height: 900 });
  page.setDefaultTimeout(90000); page.setDefaultNavigationTimeout(120000);
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) page.errors.push("console: " + m.text()); });
  return page;
}

let seq = 100;
async function enrollUi(browser, pk, mobile) {
  const page = await newPage(browser, mobile);
  const n = ++seq;
  await page.goto(`${SITE}/enroll?${pk.q}`, { waitUntil: "networkidle2", timeout: 120000 });
  await waitText(page, "About the student");
  await page.type("#age", String(pk.age));
  if (pk.tuition) { await page.select("#grade", "Grade 6"); const subj = await page.$$eval("#subject option", (o) => o.find((x) => x.textContent === "Mathematics").value); await page.select("#subject", subj); }
  else {
    await page.waitForSelector("button.border-emerald", { timeout: 10000 });   // the single fitting age group is auto-selected
  }
  await clickText(page, "Continue", "button");
  await waitText(page, "Parent and student details");
  await page.type("#pn", `Test Parent ${n}`); await page.type("#wa", `0333 57${String(60000 + n)}`); await page.type("#em", `p${n}@example.com`);
  await page.type("#ct", "Lahore"); await page.type("#sn", `Kid${n}`);
  await page.select("#tm", "Evening (4 PM – 8 PM)");
  await page.click("input[type=checkbox]");
  await clickText(page, "Continue", "button");
  await waitText(page, "Total payable now");
  const total = await page.evaluate(() => document.body.innerText.match(/Total payable now\s*\n?\s*(Rs\.[^\n]+)/)?.[1]);
  ok(total === money(pk.price), `${pk.name} [${mobile ? "mobile" : "desktop"}]: review total shows ${money(pk.price)} (got ${total})`);
  await clickText(page, "Continue to Payment", "button");
  await page.waitForFunction(() => location.pathname.startsWith("/pay/") || document.querySelector("[role=alert]"), { timeout: 60000 });
  const failMsg = await page.evaluate(() => document.querySelector("[role=alert]")?.textContent);
  if (failMsg) throw new Error("enrollment was refused by the site: " + failMsg);
  const ref = page.url().split("/pay/")[1];
  await waitText(page, "Complete Your Payment");
  const body = await page.evaluate(() => document.body.innerText);
  ok(body.includes(ref) && body.includes(money(pk.price)), `  pay page shows ${ref} and ${money(pk.price)}`);
  const [row] = await get(`enrollments?ref=eq.${ref}&select=*`);
  ok(row && row.amount_pkr === pk.price && row.status === "pending", `  DB row saved: amount ${row?.amount_pkr}, status ${row?.status}`);
  ok(row?.parent_id && row?.student_id && row?.package_id, "  linked to parent, student and package records");
  ok(page.errors.length === 0, "  no browser errors" + (page.errors.length ? ": " + page.errors.join(" | ") : ""));
  return { page, ref, n, pk };
}

async function submitPayment(page, ref, txn, method = "Bank transfer") {
  await page.select("#payment_method", method);
  await page.type("#payment_txn_id", txn);
  await clickText(page, "I Have Paid", "button");
}

async function adminLogin(browser) {
  const page = await newPage(browser, false);
  await page.goto(`${SITE}/admin/login`, { waitUntil: "networkidle2", timeout: 120000 });
  await page.type("#email", ADMIN.email); await page.type("#password", ADMIN.password);
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }), clickText(page, "Sign in", "button")]);
  return page;
}
const card = (page, ref) => page.evaluateHandle((r) => [...document.querySelectorAll("b")].find((b) => b.textContent.trim() === r)?.closest(".rounded-2xl"), ref);

async function adminVerify(page, ref, received) {
  await page.goto(`${SITE}/admin/payments`, { waitUntil: "networkidle2", timeout: 120000 });
  const c = (await card(page, ref)).asElement(); if (!c) throw new Error("payment card not found for " + ref);
  if (received !== undefined) { const i = await c.$("input[name=received]"); await i.click({ clickCount: 3 }); await i.type(String(received)); }
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2", timeout: 120000 }), (await c.$("form button.btn-gold")).click()]);
  return page.evaluate(() => document.body.innerText);
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--user-data-dir=" + OUT + "\\chrome-e2e"] });
  const shot = async (page, name) => page.screenshot({ path: `${OUT}\\${name}.png`, fullPage: false });

  // ---------------------------------------------------------------- 1. every package, desktop and mobile
  console.log("\n1) Enroll every package on desktop and mobile");
  const made = [];
  for (const [i, pk] of PACKAGES.entries()) for (const mobile of [false, true]) {
    if (!mobile && i % 2 === 1 || mobile && i % 2 === 0) { /* keep run time sane: each package once on each device class, alternating */ }
    const r = await enrollUi(browser, pk, mobile);
    made.push(r);
    if (i === 1) await shot(r.page, mobile ? "pay-mobile" : "pay-desktop");
  }

  // ---------------------------------------------------------------- 2. validation / abuse
  console.log("\n2) Rejected inputs");
  const pk0 = (await get("packages?select=*&duration_key=eq.monthly&class_type=eq.group"))[0];
  const ag = await get("age_groups?select=*&order=sort.asc"); const A = ag[0];
  const post = (b) => fetch(`${SITE}/api/enroll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then(async (r) => ({ s: r.status, j: await r.json() }));
  const base = { package_id: pk0.id, parent_name: "Neg Test", whatsapp: "03335761999", city: "Lahore", student_first_name: "Neg", student_age: 10, age_group_id: A.id, consent: true };
  let r = await post(base); ok(r.s === 400 && /age group/i.test(r.j.error), "age 10 in Group A is refused: " + r.j.error);
  r = await post({ ...base, age_group_id: ag[1].id, consent: false }); ok(r.s === 400 && /consent/i.test(r.j.error), "no consent is refused");
  r = await post({ ...base, age_group_id: ag[1].id, whatsapp: "12345" }); ok(r.s === 400 && /whatsapp/i.test(r.j.error), "bad WhatsApp number is refused");
  r = await post({ ...base, age_group_id: ag[1].id, website: "http://spam" }); ok(r.s === 400, "honeypot field is refused");
  r = await post({ ...base, age_group_id: ag[1].id, expected_amount: 5999 }); ok(r.s === 400 && /price/i.test(r.j.error), "stale displayed price is refused: " + r.j.error);
  r = await post({ ...base, age_group_id: ag[1].id, package_id: "00000000-0000-0000-0000-000000000000" }); ok(r.s === 400, "unknown package is refused");
  const tuition = (await get("packages?select=*&duration_key=eq.4w&class_type=eq.group"))[0];
  r = await post({ ...base, package_id: tuition.id, age_group_id: "", school_grade: "", student_age: 11 }); ok(r.s === 400 && /grade/i.test(r.j.error), "tuition without grade is refused");

  // ---------------------------------------------------------------- 3. payment submission rules
  console.log("\n3) Payment submission");
  const a = made[0], b = made[2], fl = made[4];
  await submitPayment(a.page, a.ref, "E2E-TXN-0001", "JazzCash");
  await waitText(a.page, "we are verifying it");
  ok(true, "parent sees 'we are verifying it' after submitting a transaction ID");
  ok((await get(`enrollments?ref=eq.${a.ref}&select=status`))[0].status === "payment_submitted", "enrollment is 'payment_submitted' (NOT enrolled)");
  await a.page.goto(`${SITE}/confirmation/${a.ref}`, { waitUntil: "networkidle2" });
  ok(!(await a.page.evaluate(() => document.body.innerText)).includes("Congratulations"), "confirmation page does NOT say enrolled before verification");
  await b.page.select("#payment_method", "JazzCash"); await b.page.type("#payment_txn_id", "e2e-txn-0001"); await clickText(b.page, "I Have Paid", "button");
  await b.page.waitForFunction(() => document.querySelector("[role=alert]")?.textContent.includes("already been used"), { timeout: 30000 });
  ok(true, "the same transaction ID cannot be reused on another enrollment");
  await submitPayment(b.page, b.ref, "E2E-TXN-0002", "Easypaisa"); await waitText(b.page, "we are verifying it");
  await submitPayment(fl.page, fl.ref, "E2E-TXN-0003", "Bank transfer"); await waitText(fl.page, "we are verifying it");
  for (const m of made.filter((x) => ![a, b, fl].includes(x))) { /* leave the rest unpaid: they must stay 'pending' */ }

  // ---------------------------------------------------------------- 4. admin
  console.log("\n4) Admin dashboard");
  const noAuth = await fetch(`${SITE}/admin/export`); ok(noAuth.status === 401, "export is blocked without login (401)");
  const noAuthPage = await fetch(`${SITE}/admin`, { redirect: "manual" }); ok([307, 308].includes(noAuthPage.status) && /login/.test(noAuthPage.headers.get("location") || ""), "dashboard redirects to login when signed out");
  const admin = await adminLogin(browser);
  ok(/Overview|Revenue/.test(await admin.evaluate(() => document.body.innerText)), "admin login works (first admin created from ADMIN_EMAIL / ADMIN_PASSWORD)");
  await shot(admin, "admin-overview");
  const bad = await newPage(browser, false); await bad.goto(`${SITE}/admin/login`, { waitUntil: "networkidle2" });
  await bad.type("#email", ADMIN.email); await bad.type("#password", "wrong-password-xx"); await Promise.all([bad.waitForNavigation({ waitUntil: "networkidle2" }), clickText(bad, "Sign in", "button")]);
  ok((await bad.evaluate(() => document.body.innerText)).includes("Incorrect email or password"), "wrong admin password is refused");

  // short payment refused
  let txt = await adminVerify(admin, a.ref, a.pk.price - 1);
  ok(/less than the amount payable/i.test(txt), "approving a SHORT payment is refused");
  ok((await get(`enrollments?ref=eq.${a.ref}&select=status`))[0].status === "payment_submitted", "  ...and the student is still not enrolled");
  txt = await adminVerify(admin, a.ref);
  ok(/Payment verified/.test(txt), "admin verifies the correct amount");
  const [ea] = await get(`enrollments?ref=eq.${a.ref}&select=*`);
  ok(ea.status === "verified" && ea.amount_pkr === a.pk.price, "  enrollment is now 'verified' with the original fee " + ea.amount_pkr);
  const [pa] = await get(`payments?enrollment_id=eq.${ea.id}&select=*`);
  ok(pa.status === "verified" && pa.amount_received === a.pk.price && pa.verified_by === ADMIN.email, "  payment record: verified, amount received, verified_by");
  await a.page.goto(`${SITE}/confirmation/${a.ref}`, { waitUntil: "networkidle2" });
  const conf = await a.page.evaluate(() => document.body.innerText);
  ok(conf.includes("Congratulations! Your Child Is Enrolled at Abu Bakkar Academy.") && conf.includes(a.ref) && conf.includes(money(a.pk.price)), "parent now sees the enrolled confirmation with ID + receipt");
  await shot(a.page, "confirmation-desktop");

  // failed payment: reject, parent retries, admin verifies
  await admin.goto(`${SITE}/admin/payments`, { waitUntil: "networkidle2" });
  const fc = (await card(admin, fl.ref)).asElement();
  await (await fc.$("input[name=note]")).type("not in statement");
  await Promise.all([admin.waitForNavigation({ waitUntil: "networkidle2" }), clickText(fc.frame ? admin : admin, "Reject", "button")]);
  ok((await get(`enrollments?ref=eq.${fl.ref}&select=status`))[0].status === "rejected", "unsuccessful payment: rejected, student NOT enrolled");
  await fl.page.goto(`${SITE}/pay/${fl.ref}`, { waitUntil: "networkidle2" });
  ok((await fl.page.evaluate(() => document.body.innerText)).includes("could not find your previous payment"), "parent sees why and can try again");
  await submitPayment(fl.page, fl.ref, "E2E-TXN-0003-RETRY"); await waitText(fl.page, "we are verifying it");
  txt = await adminVerify(admin, fl.ref); ok(/Payment verified/.test(txt), "retry payment verified");

  // batches and capacity
  console.log("\n5) Class batches and capacity");
  await admin.goto(`${SITE}/admin/batches`, { waitUntil: "networkidle2" });
  await admin.type("input[name=name]", "Group B Evening"); await admin.select("select[name=program_id]", (await get("programs?select=id&slug=eq.character-grooming"))[0].id);
  await admin.select("select[name=class_type]", "group"); await admin.type("input[name=timing]", "Mon–Fri 5:00–6:00 PM"); await admin.evaluate(() => { document.querySelector("input[name=capacity]").value = ""; });
  await admin.type("input[name=capacity]", "1"); await admin.type("input[name=teacher]", "Ustaz Test");
  await Promise.all([admin.waitForNavigation({ waitUntil: "networkidle2" }), clickText(admin, "Create batch", "button")]);
  ok((await get("class_batches?select=*")).length === 1, "admin created a class batch (capacity 1)");
  const batch = (await get("class_batches?select=*"))[0];
  // assign a: ok; assign other verified student: full
  const assign = async (ref) => {
    await admin.goto(`${SITE}/admin/enrollments?q=${ref}`, { waitUntil: "networkidle2" });
    await admin.evaluate(() => document.querySelector("details").open = true);
    const sel = await admin.$("select[name=batch_id]"); if (!sel) return "no-select";
    await admin.select("select[name=batch_id]", batch.id);
    await Promise.all([admin.waitForNavigation({ waitUntil: "networkidle2" }), clickText(admin, "Save class", "button")]);
    return admin.evaluate(() => document.body.innerText);
  };
  // the batch is for the character program, group type. a = character/group/monthly (fits), b = character/group/6m (fits)
  txt = await assign(a.ref); ok(/assigned to the class/.test(txt), "verified student assigned to the class batch");
  txt = await adminVerify(admin, b.ref); ok(/Payment verified/.test(txt), "second student verified");
  txt = await assign(b.ref); ok(/batch is full/i.test(txt), "capacity is enforced: a full batch refuses another student");
  // an unpaid student cannot be assigned (no select offered)
  const unpaid = made.find((x) => ![a, b, fl].includes(x));
  await admin.goto(`${SITE}/admin/enrollments?q=${unpaid.ref}`, { waitUntil: "networkidle2" });
  await admin.evaluate(() => document.querySelector("details").open = true);
  ok(!(await admin.$("select[name=batch_id]")), "an unpaid student cannot be placed in a class (no assignment option)");

  // the website now shows real capacity: batch 1/1 full for group + age groups → "Seats full"
  await admin.goto(`${SITE}/`, { waitUntil: "networkidle2" });
  const home = await admin.evaluate(() => document.body.innerText);
  ok(/Seats full/.test(home) || /Limited seats/.test(home) || /Join waiting list/.test(home), "homepage reflects real batch capacity (limited / full) after seats are used");
  const full = await post({ ...base, age_group_id: ag[1].id, student_age: 10, student_first_name: "Late", whatsapp: "03335761888" });
  ok(full.s === 400 && /full/i.test(full.j.error), "new enrollment for a FULL choice is refused: " + full.j.error);

  // refund releases the seat
  await admin.goto(`${SITE}/admin/enrollments?q=${a.ref}`, { waitUntil: "networkidle2" });
  await admin.evaluate(() => document.querySelector("details").open = true);
  await Promise.all([admin.waitForNavigation({ waitUntil: "networkidle2" }), clickText(admin, "Mark refunded", "button")]);
  const [ra] = await get(`enrollments?ref=eq.${a.ref}&select=status,class_batch_id`);
  ok(ra.status === "refunded" && ra.class_batch_id === null, "refund marks the enrollment refunded and frees the class seat");

  // ---------------------------------------------------------------- 6. money integrity
  console.log("\n6) Integrity checks across ALL records");
  const enr = await get("enrollments?select=*"), pay = await get("payments?select=*");
  const verifiedNoPay = enr.filter((e) => e.status === "verified" && !pay.some((p) => p.enrollment_id === e.id && p.status === "verified"));
  ok(verifiedNoPay.length === 0, `no enrollment is 'verified' without a verified payment (${enr.filter((e) => e.status === "verified").length} verified checked)`);
  const wrongFee = enr.filter((e) => e.package_id).filter((e) => { const p = PACKAGES.find((x) => x.price === e.amount_pkr); return !p; });
  ok(wrongFee.length === 0, "every stored fee equals one of the 8 package prices");
  ok(enr.filter((e) => e.status === "pending").length >= 8, "unpaid enrollments stay 'pending' (not enrolled)");
  ok(new Set(enr.map((e) => e.ref)).size === enr.length, "all enrollment IDs are unique");
  const ev = await get("events?select=name&name=eq.payment_verified");
  ok(ev.length === enr.filter((e) => e.verified_at).length, "server recorded one 'payment_verified' event per verified payment");

  // CSV export
  const cookies = (await admin.cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const csv = await fetch(`${SITE}/admin/export`, { headers: { cookie: cookies } });
  const csvText = await csv.text();
  ok(csv.status === 200 && /text\/csv/.test(csv.headers.get("content-type")) && csvText.includes(a.ref) && csvText.includes("Amount charged"), "CSV export works for admins and contains enrollments");

  // admin pages render
  for (const p of ["/admin", "/admin/payments", "/admin/enrollments", "/admin/people", "/admin/batches", "/admin/packages", "/admin/settings"]) {
    const res = await fetch(`${SITE}${p}`, { headers: { cookie: cookies } }); ok(res.status === 200, `admin page ${p} loads (200)`);
  }
  await admin.goto(`${SITE}/admin/payments?view=all`, { waitUntil: "networkidle2" }); await shot(admin, "admin-payments");

  // ---------------------------------------------------------------- 7. admin changes price → new checkouts only
  console.log("\n7) Price editing");
  await admin.goto(`${SITE}/admin/packages`, { waitUntil: "networkidle2" });
  const form = (await admin.evaluateHandle((id) => document.querySelector(`input[name=id][value="${id}"]`).closest("form"), pk0.id)).asElement();
  const pi = await form.$("input[name=price_pkr]"); await pi.click({ clickCount: 3 }); await pi.type("6500");
  await Promise.all([admin.waitForNavigation({ waitUntil: "networkidle2" }), (await form.$("button")).click()]);
  ok((await get(`packages?id=eq.${pk0.id}&select=price_pkr`))[0].price_pkr === 6500, "admin changed the Group monthly price to Rs. 6,500");
  ok((await get(`enrollments?ref=eq.${made[0].ref}&select=amount_pkr`))[0].amount_pkr === 6000, "  the earlier enrollment kept its Rs. 6,000 fee");
  await admin.goto(SITE + "/", { waitUntil: "networkidle2" });
  ok((await admin.evaluate(() => document.body.innerText)).includes("Rs. 6,500"), "  the homepage now advertises Rs. 6,500");
  await form.evaluate(() => 0);
  await admin.goto(`${SITE}/admin/packages`, { waitUntil: "networkidle2" });
  const f2 = (await admin.evaluateHandle((id) => document.querySelector(`input[name=id][value="${id}"]`).closest("form"), pk0.id)).asElement();
  const p2 = await f2.$("input[name=price_pkr]"); await p2.click({ clickCount: 3 }); await p2.type("6000");
  await Promise.all([admin.waitForNavigation({ waitUntil: "networkidle2" }), (await f2.$("button")).click()]);

  // ---------------------------------------------------------------- 8. screenshots of the public pages
  console.log("\n8) Screenshots");
  for (const mobile of [false, true]) {
    const p = await newPage(browser, mobile); const tag = mobile ? "mobile" : "desktop";
    await p.goto(SITE + "/", { waitUntil: "networkidle2", timeout: 120000 }); await shot(p, `home-${tag}`);
    await p.evaluate(() => document.querySelector("#packages").scrollIntoView()); await sleep(300); await shot(p, `packages-${tag}`);
    await p.evaluate(() => document.querySelector("#tuition").scrollIntoView()); await sleep(300); await shot(p, `tuition-${tag}`);
    await p.goto(`${SITE}/enroll`, { waitUntil: "networkidle2" }); await shot(p, `enroll-step1-${tag}`);
    await clickText(p, "Character Grooming", "button"); await sleep(400); await shot(p, `enroll-step2-${tag}`);
    await p.goto(`${SITE}/refund-policy`, { waitUntil: "networkidle2" }); await shot(p, `refund-${tag}`);
    ok(p.errors.length === 0, `${tag}: no browser errors on public pages` + (p.errors.length ? ": " + p.errors.join(" | ") : ""));
  }

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("E2E crashed:", e); process.exit(2); });
process.on("unhandledRejection", (e) => { console.error("UNHANDLED:", e && e.stack || e); });
