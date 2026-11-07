// Database rules test. Runs supabase/schema.sql on a real in-memory Postgres (PGlite).
// Run:  node --test tests/db.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const NEW = fs.readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
const OLD = fs.readFileSync(new URL("./old-schema.sql", import.meta.url), "utf8");
let db;
const q = async (sql, params) => (await db.query(sql, params)).rows;
const fails = async (fn, code) => {
  await assert.rejects(fn, (e) => { assert.match(String(e.message), new RegExp(code)); return true; });
};

const base = (over = {}) => ({
  package_id: null, parent_name: "Ayesha Khan", whatsapp: "923001112223", email: "a@example.com", city: "Lahore",
  student_first_name: "Ali", student_age: 9, age_group_id: null, school_grade: "", subject_id: null,
  preferred_timing: "Evening (4 PM – 8 PM)", consent: true, source: "facebook / test", utm: { source: "facebook", campaign: "test" },
  ...over,
});
const enroll = async (over) => (await q("select create_enrollment($1::jsonb) as r", [JSON.stringify(base(over))]))[0].r;
const pkg = async (slug, type, key) => (await q(
  "select k.* from packages k join programs p on p.id=k.program_id where p.slug=$1 and k.class_type=$2 and k.duration_key=$3", [slug, type, key]))[0];
const ag = async (code) => (await q("select * from age_groups where code=$1", [code]))[0];

before(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  // 1) the OLD live database, with some real-looking data
  await db.exec(OLD);
  const [prog] = await q("select id from programs where slug='character-grooming'");
  await db.query(
    `insert into enrollments(ref,parent_name,whatsapp,child_first_name,child_age,grade,city,program_id,amount_pkr,status,consent_at,payment_txn_id)
     values ('ABA-OLD00001','Old Parent','923009998887','Zain',10,'Grade 5','Karachi',$1,4999,'verified',now(),'TXN-OLD-1'),
            ('ABA-OLD00002','Old Parent 2','923009998886','Sara',7,'Grade 2','Multan',$1,4999,'pending',now(),null)`, [prog.id]);
  await db.query("update settings set value='My real bank details' where key='bank_details'");
  await db.query("update settings set value='Custom edited headline' where key='hero_hook'");
  // 2) apply the NEW script — twice (must be re-runnable)
  await db.exec(NEW);
  await db.exec(NEW);
});

test("old data is untouched and old verified enrollment stays verified", async () => {
  const rows = await q("select ref,status,amount_pkr,payment_txn_id from enrollments order by ref");
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { ref: "ABA-OLD00001", status: "verified", amount_pkr: 4999, payment_txn_id: "TXN-OLD-1" });
  assert.equal(rows[1].status, "pending");
});

test("edited settings survive; untouched old defaults are upgraded; placeholders cleared", async () => {
  const s = Object.fromEntries((await q("select key,value from settings")).map((r) => [r.key, r.value]));
  assert.equal(s.bank_details, "My real bank details");
  assert.equal(s.hero_hook, "Custom edited headline");           // admin edit is never overwritten
  assert.equal(s.jazzcash_number, "");                           // old placeholder text removed
  assert.equal(s.hero_sub, "Sirf Uski Taleem Ki Wajah Se Nahi!\nUske Kirdar Aur Akhlaq Ki Wajah Se"); // old default replaced
});

test("old programs converted: no Founding Batch, both open, correct kinds", async () => {
  const p = await q("select slug,name,kind,status,is_main from programs order by sort");
  assert.deepEqual(p.map((x) => [x.slug, x.name, x.kind, x.status]), [
    ["character-grooming", "Character Grooming", "character", "open"],
    ["academic-tuition", "Academic Tuition", "tuition", "open"]]);
  assert.equal(p[0].is_main, true);
  assert.equal((await q("select count(*)::int n from programs where name ilike '%founding%'"))[0].n, 0);
});

test("all package prices match the brief", async () => {
  const rows = await q(`select p.slug, k.class_type, k.duration_key, k.price_pkr, k.sessions from packages k
                        join programs p on p.id=k.program_id order by k.sort`);
  assert.deepEqual(rows.map((r) => [r.slug, r.class_type, r.duration_key, r.price_pkr, r.sessions]), [
    ["character-grooming", "group", "monthly", 6000, null], ["character-grooming", "group", "3m", 16500, null],
    ["character-grooming", "group", "6m", 30000, null],     ["character-grooming", "private", "monthly", 13000, null],
    ["character-grooming", "private", "3m", 36000, null],   ["character-grooming", "private", "6m", 69000, null],
    ["academic-tuition", "group", "4w", 5999, 12],          ["academic-tuition", "private", "4w", 15999, 12]]);
});

test("age groups A/B/C exist", async () => {
  const g = await q("select code,min_age,max_age from age_groups order by code");
  assert.deepEqual(g, [{ code: "A", min_age: 5, max_age: 8 }, { code: "B", min_age: 8, max_age: 12 }, { code: "C", min_age: 12, max_age: 15 }]);
});

test("every package: checkout stores exactly the package price (fee snapshot)", async () => {
  const A = await ag("A"), B = await ag("B"), C = await ag("C");
  let n = 0;
  for (const type of ["group", "private"]) for (const key of ["monthly", "3m", "6m"]) {
    const k = await pkg("character-grooming", type, key);
    const r = await enroll({ package_id: k.id, age_group_id: B.id, student_age: 10, whatsapp: `92300000${n++}00${n}`.slice(0, 12), student_first_name: "Kid" + n });
    assert.equal(r.amount, k.price_pkr);
    const [e] = await q("select amount_pkr, package_label, class_type, term_months, status from enrollments where ref=$1", [r.ref]);
    assert.equal(e.amount_pkr, k.price_pkr); assert.equal(e.status, "pending"); assert.equal(e.class_type, type);
    assert.equal(e.term_months, k.months); assert.equal(e.package_label, k.label);
  }
  for (const type of ["group", "private"]) {
    const k = await pkg("academic-tuition", type, "4w");
    const subj = (await q("select id from subjects where name='Mathematics'"))[0];
    const r = await enroll({ package_id: k.id, school_grade: "Grade 6", subject_id: subj.id, whatsapp: `92311000${n++}00${n}`.slice(0, 12), student_first_name: "T" + n });
    assert.equal(r.amount, k.price_pkr);
  }
  void A; void C;
});

test("checkout refuses if the displayed total no longer matches the real price", async () => {
  const B = await ag("B"); const k = await pkg("character-grooming", "group", "monthly");
  await fails(() => enroll({ package_id: k.id, age_group_id: B.id, expected_amount: 5999, whatsapp: "923007770099", student_first_name: "Stale" }), "PRICE_CHANGED");
  const ok = await enroll({ package_id: k.id, age_group_id: B.id, expected_amount: 6000, whatsapp: "923007770099", student_first_name: "Fresh" });
  assert.equal(ok.amount, 6000);
});

test("price edits later do not change an existing enrollment's fee", async () => {
  const B = await ag("B"); const k = await pkg("character-grooming", "group", "monthly");
  const r = await enroll({ package_id: k.id, age_group_id: B.id, whatsapp: "923007770001", student_first_name: "Snap" });
  await db.query("update packages set price_pkr=7000 where id=$1", [k.id]);
  const [e] = await q("select amount_pkr from enrollments where ref=$1", [r.ref]);
  assert.equal(e.amount_pkr, 6000);
  const r2 = await enroll({ package_id: k.id, age_group_id: B.id, whatsapp: "923007770002", student_first_name: "Snap2" });
  assert.equal(r2.amount, 7000);                                   // new checkouts use the new price
  await db.query("update packages set price_pkr=6000 where id=$1", [k.id]);
  await fails(() => db.query("update enrollments set amount_pkr=1 where ref=$1", [r.ref]), "FEE_LOCKED");
});

test("age group must match the student's age; boundary ages fit two groups", async () => {
  const A = await ag("A"), B = await ag("B"), C = await ag("C"); const k = await pkg("character-grooming", "group", "monthly");
  await fails(() => enroll({ package_id: k.id, age_group_id: A.id, student_age: 10, whatsapp: "923005550001" }), "AGE_GROUP_MISMATCH");
  await fails(() => enroll({ package_id: k.id, age_group_id: C.id, student_age: 11, whatsapp: "923005550002" }), "AGE_GROUP_MISMATCH");
  await enroll({ package_id: k.id, age_group_id: A.id, student_age: 8, whatsapp: "923005550003", student_first_name: "Eight A" });
  await enroll({ package_id: k.id, age_group_id: B.id, student_age: 8, whatsapp: "923005550004", student_first_name: "Eight B" });
  await enroll({ package_id: k.id, age_group_id: B.id, student_age: 12, whatsapp: "923005550005", student_first_name: "Twelve B" });
  await enroll({ package_id: k.id, age_group_id: C.id, student_age: 12, whatsapp: "923005550006", student_first_name: "Twelve C" });
  await fails(() => enroll({ package_id: k.id, age_group_id: C.id, student_age: 16, whatsapp: "923005550007" }), "AGE_GROUP_MISMATCH");
});

test("consent, tuition grade/subject and unknown package are enforced", async () => {
  const k = await pkg("character-grooming", "group", "monthly"); const B = await ag("B");
  await fails(() => enroll({ package_id: k.id, age_group_id: B.id, consent: false, whatsapp: "923004440001" }), "CONSENT_REQUIRED");
  await fails(() => enroll({ package_id: "00000000-0000-0000-0000-000000000000", age_group_id: B.id, whatsapp: "923004440002" }), "PACKAGE_UNAVAILABLE");
  const t = await pkg("academic-tuition", "group", "4w");
  await fails(() => enroll({ package_id: t.id, school_grade: "", subject_id: null, whatsapp: "923004440003" }), "GRADE_REQUIRED");
  await fails(() => enroll({ package_id: t.id, school_grade: "Grade 4", subject_id: null, whatsapp: "923004440004" }), "SUBJECT_REQUIRED");
});

test("same parent can enroll two children; double-submit returns the same enrollment", async () => {
  const k = await pkg("character-grooming", "group", "monthly"); const B = await ag("B");
  const a = await enroll({ package_id: k.id, age_group_id: B.id, whatsapp: "923003330001", student_first_name: "Sib1" });
  const again = await enroll({ package_id: k.id, age_group_id: B.id, whatsapp: "923003330001", student_first_name: "sib1" });
  assert.equal(again.ref, a.ref); assert.equal(again.existing, true);
  const b = await enroll({ package_id: k.id, age_group_id: B.id, whatsapp: "923003330001", student_first_name: "Sib2" });
  assert.notEqual(b.ref, a.ref);
  assert.equal((await q("select count(*)::int n from parents where whatsapp='923003330001'"))[0].n, 1);
  assert.equal((await q("select count(*)::int n from students s join parents p on p.id=s.parent_id where p.whatsapp='923003330001'"))[0].n, 2);
});

test("enrollment IDs are unique and well-formed", async () => {
  const refs = (await q("select ref from enrollments")).map((r) => r.ref);
  assert.equal(new Set(refs).size, refs.length);
  for (const r of refs.filter((x) => !x.startsWith("ABA-OLD"))) assert.match(r, /^ABA-[A-HJ-NP-Z2-9]{8}$/);
});

test("PAYMENT FLOW: pending -> submitted -> verified; nobody is enrolled without a verified payment", async () => {
  const k = await pkg("character-grooming", "private", "3m"); const B = await ag("B");
  const r = await enroll({ package_id: k.id, age_group_id: B.id, whatsapp: "923002220001", student_first_name: "Pay1" });
  const [e0] = await q("select id,status from enrollments where ref=$1", [r.ref]);
  // direct attempts to mark verified are blocked by the database itself
  await fails(() => db.query("update enrollments set status='verified' where id=$1", [e0.id]), "PAYMENT_NOT_VERIFIED");
  const s = (await q("select submit_payment($1,'JazzCash','TXN-ABC-1234','Ahmed') as r", [r.ref]))[0].r;
  assert.equal((await q("select status from enrollments where id=$1", [e0.id]))[0].status, "payment_submitted");
  await fails(() => db.query("update enrollments set status='verified' where id=$1", [e0.id]), "PAYMENT_NOT_VERIFIED");
  // a short payment cannot be approved
  await fails(() => db.query("select verify_payment($1,'admin@x.com',$2)", [s.payment_id, k.price_pkr - 1]), "SHORT_PAYMENT");
  assert.equal((await q("select status from enrollments where id=$1", [e0.id]))[0].status, "payment_submitted");
  // approve with the right amount
  await q("select verify_payment($1,'admin@x.com',$2)", [s.payment_id, k.price_pkr]);
  const [e1] = await q("select status,verified_at,amount_pkr from enrollments where id=$1", [e0.id]);
  assert.equal(e1.status, "verified"); assert.ok(e1.verified_at); assert.equal(e1.amount_pkr, 36000);
  const [p1] = await q("select status,amount_received,verified_by from payments where id=$1", [s.payment_id]);
  assert.deepEqual(p1, { status: "verified", amount_received: 36000, verified_by: "admin@x.com" });
  await fails(() => db.query("select verify_payment($1,'admin@x.com',36000)", [s.payment_id]), "ALREADY_VERIFIED");
  assert.equal((await q("select count(*)::int n from events where name='payment_verified' and session_id=$1", ["server:" + r.ref]))[0].n, 1);
});

test("FAILED PAYMENT: rejected payment keeps the student un-enrolled and allows a retry", async () => {
  const k = await pkg("character-grooming", "group", "6m"); const B = await ag("B");
  const r = await enroll({ package_id: k.id, age_group_id: B.id, whatsapp: "923002220002", student_first_name: "Fail1" });
  const s = (await q("select submit_payment($1,'Easypaisa','BAD-TXN-0001',null) as r", [r.ref]))[0].r;
  await q("select reject_payment($1,'admin@x.com','not found in statement')", [s.payment_id]);
  const [e] = await q("select id,status from enrollments where ref=$1", [r.ref]);
  assert.equal(e.status, "rejected");
  await fails(() => db.query("update enrollments set status='verified' where id=$1", [e.id]), "PAYMENT_NOT_VERIFIED");
  const s2 = (await q("select submit_payment($1,'Easypaisa','GOOD-TXN-0002',null) as r", [r.ref]))[0].r;   // retry works
  await q("select verify_payment($1,'admin@x.com',30000)", [s2.payment_id]);
  assert.equal((await q("select status from enrollments where ref=$1", [r.ref]))[0].status, "verified");
});

test("the same transaction reference cannot be used twice; wrong-state submissions are refused", async () => {
  const k = await pkg("character-grooming", "group", "monthly"); const B = await ag("B");
  const a = await enroll({ package_id: k.id, age_group_id: B.id, whatsapp: "923002220003", student_first_name: "Dup1" });
  const b = await enroll({ package_id: k.id, age_group_id: B.id, whatsapp: "923002220004", student_first_name: "Dup2" });
  await q("select submit_payment($1,'JazzCash','SAME-REF-9999',null)", [a.ref]);
  await fails(() => db.query("select submit_payment($1,'jazzcash','same-ref-9999',null)", [b.ref]), "TXN_REUSED");
  await fails(() => db.query("select submit_payment($1,'Bank transfer','OTHER-1234',null)", [a.ref]), "ALREADY_SUBMITTED");
  await fails(() => db.query("select submit_payment('ABA-NOPE0000','Bank transfer','OTHER-1234',null)"), "ENROLLMENT_NOT_FOUND");
  await fails(() => db.query("select submit_payment($1,'Bank transfer','abc',null)", [b.ref]), "BAD_TXN");
});

test("BATCHES: only verified students can be placed; capacity is enforced; refund frees the seat", async () => {
  const [prog] = await q("select id from programs where slug='character-grooming'"); const B = await ag("B");
  const k = await pkg("character-grooming", "group", "monthly");
  const [batch] = await q(`insert into class_batches(name,program_id,class_type,age_group_id,timing,capacity,teacher)
                           values ('B Evening',$1,'group',$2,'Mon–Fri 5–6 PM',2,'Ustaz X') returning id`, [prog.id, B.id]);
  const mk = async (n) => {
    const r = await enroll({ package_id: k.id, age_group_id: B.id, whatsapp: `92300888000${n}`, student_first_name: "Cap" + n });
    const [e] = await q("select id from enrollments where ref=$1", [r.ref]);
    return { ...r, id: e.id };
  };
  const pay = async (r) => { const s = (await q("select submit_payment($1,'Bank transfer',$2,null) as r", [r.ref, "CAP-TXN-" + r.ref])) [0].r; await q("select verify_payment($1,'a',6000)", [s.payment_id]); };
  const a = await mk(1), b = await mk(2), c = await mk(3);
  await fails(() => db.query("select assign_batch($1,$2)", [a.id, batch.id]), "NOT_ENROLLED");       // unpaid
  await db.query("update enrollments set class_batch_id=$2 where id=$1", [a.id, batch.id]);   // direct write for an unpaid student...
  assert.equal((await q("select class_batch_id from enrollments where id=$1", [a.id]))[0].class_batch_id, null);
  for (const r of [a, b, c]) await pay(r);
  await q("select assign_batch($1,$2)", [a.id, batch.id]);
  await q("select assign_batch($1,$2)", [b.id, batch.id]);
  await fails(() => db.query("select assign_batch($1,$2)", [c.id, batch.id]), "BATCH_FULL");
  const [s1] = await q("select * from seats_for($1,'group',$2)", [prog.id, B.id]);
  assert.deepEqual(s1, { has_batches: true, seats_left: 0 });
  // the matching choice is now full -> new checkouts for it are refused (no money taken for a full class)
  await fails(() => enroll({ package_id: k.id, age_group_id: B.id, whatsapp: "923008880009", student_first_name: "Late" }), "SEATS_FULL");
  // refund frees the seat
  await q("select refund_enrollment($1,'admin','refund requested')", [a.id]);
  assert.equal((await q("select status,class_batch_id from enrollments where id=$1", [a.id]))[0].class_batch_id, null);
  assert.equal((await q("select status from payments where enrollment_id=$1", [a.id]))[0].status, "refunded");
  await q("select assign_batch($1,$2)", [c.id, batch.id]);                                             // seat reusable
  const [s2] = await q("select * from seats_for($1,'group',$2)", [prog.id, B.id]);
  assert.equal(s2.seats_left, 0);
  // wrong class type / program batch refused
  const [pb] = await q(`insert into class_batches(name,program_id,class_type,capacity) values ('Private only',$1,'private',5) returning id`, [prog.id]);
  await fails(() => db.query("select assign_batch($1,$2)", [b.id, pb.id]), "BATCH_WRONG_CLASS_TYPE");
});

test("no batches set up = no restriction and no 'limited seats' signal", async () => {
  const [t] = await q("select id from programs where slug='academic-tuition'");
  const [s] = await q("select * from seats_for($1,'group',null)", [t.id]);
  assert.deepEqual(s, { has_batches: false, seats_left: 0 });
});

test("re-running the script again afterwards still keeps everything", async () => {
  const before = (await q("select count(*)::int n from enrollments"))[0].n;
  await db.exec(NEW);
  assert.equal((await q("select count(*)::int n from enrollments"))[0].n, before);
  assert.equal((await q("select count(*)::int n from packages"))[0].n, 8);
});
