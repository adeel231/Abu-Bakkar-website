// Run: node --test tests/pricing.test.mjs   (Node 22+/24 runs the .ts file directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import * as P from "../lib/pricing.ts";

const pk = (id, prog, type, key, months, price) => ({ id, program_id: prog, class_type: type, duration_key: key, label: key, months, price_pkr: price, sessions: null, schedule_note: "", sort: months, active: true });
const pkgs = [
  pk("g1", "cg", "group", "monthly", 1, 6000), pk("g3", "cg", "group", "3m", 3, 16500), pk("g6", "cg", "group", "6m", 6, 30000),
  pk("p1", "cg", "private", "monthly", 1, 13000), pk("p3", "cg", "private", "3m", 3, 36000), pk("p6", "cg", "private", "6m", 6, 69000),
];

test("advance-payment savings match the brief", () => {
  const gm = P.monthlyPackage(pkgs, "cg", "group"), pm = P.monthlyPackage(pkgs, "cg", "private");
  assert.equal(P.savings(pkgs[1], gm), 1500);   // 3 x 6000 - 16500
  assert.equal(P.savings(pkgs[2], gm), 6000);   // 6 x 6000 - 30000
  assert.equal(P.savings(pkgs[4], pm), 3000);   // 3 x 13000 - 36000
  assert.equal(P.savings(pkgs[5], pm), 9000);   // 6 x 13000 - 69000
  assert.equal(P.savings(gm, gm), 0);
});

test("total payable equals the selected package price, for every package", () => {
  for (const p of pkgs) assert.equal(P.totalPayable(p), p.price_pkr);
});

test("plan() orders monthly, 3 months, 6 months", () => {
  assert.deepEqual(P.plan(pkgs, "cg", "private").map((p) => p.duration_key), ["monthly", "3m", "6m"]);
});

test("per-month equivalent", () => {
  assert.equal(P.perMonth(pkgs[2]), 5000);
  assert.equal(P.perMonth(pkgs[5]), 11500);
});

const groups = [
  { id: "A", code: "A", label: "A", min_age: 5, max_age: 8, focus: "", sort: 1, active: true },
  { id: "B", code: "B", label: "B", min_age: 8, max_age: 12, focus: "", sort: 2, active: true },
  { id: "C", code: "C", label: "C", min_age: 12, max_age: 15, focus: "", sort: 3, active: true },
];
test("age groups, including boundary ages 8 and 12", () => {
  const ids = (a) => P.groupsForAge(a, groups).map((g) => g.id).join("");
  assert.equal(ids(4), ""); assert.equal(ids(5), "A"); assert.equal(ids(7), "A"); assert.equal(ids(8), "AB");
  assert.equal(ids(10), "B"); assert.equal(ids(12), "BC"); assert.equal(ids(14), "C"); assert.equal(ids(15), "C"); assert.equal(ids(16), "");
  assert.equal(P.isBoundaryAge(8, groups), true); assert.equal(P.isBoundaryAge(9, groups), false);
});

test("Pakistani mobile numbers are normalised", () => {
  assert.equal(P.normalisePk("0333 5760892"), "923335760892");
  assert.equal(P.normalisePk("+92 333 5760892"), "923335760892");
  assert.equal(P.normalisePk("00923335760892"), "923335760892");
  assert.equal(P.normalisePk("923335760892"), "923335760892");
  assert.equal(P.normalisePk("12345"), null);
  assert.equal(P.normalisePk("0421234567"), null);
});

test("payment details: placeholders are not treated as real", () => {
  assert.equal(P.isConfigured(""), false); assert.equal(P.isConfigured("03XX-XXXXXXX (Account title: ...)"), false);
  assert.equal(P.isConfigured("Bank: <your bank>"), false); assert.equal(P.isConfigured("0333 5760892 (Abu Bakkar Academy)"), true);
});

test("limited seats shows only when real capacity is nearly used up", () => {
  assert.equal(P.isLimited(false, 0, 10), false);   // no capacity set up
  assert.equal(P.isLimited(true, 0, 10), false);    // full is not "limited"
  assert.equal(P.isLimited(true, 4, 10), true);
  assert.equal(P.isLimited(true, 40, 10), false);
});
