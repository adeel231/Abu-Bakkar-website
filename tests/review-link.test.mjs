// Tests for the signed approve/reject links in the receipt email.
import test from "node:test";
import assert from "node:assert/strict";

process.env.ADMIN_COOKIE_SECRET = "test-secret-test-secret-test-secret";
const { reviewUrl, checkReview } = await import("../lib/reviewLink.ts");

const PAY = "0b6f3a52-6c63-4a9a-9a39-0d2f5d8f1c11";
const parse = (url) => Object.fromEntries(new URL(url).searchParams);

test("a fresh link is valid and carries the payment, the action and the admin", () => {
  const q = parse(reviewUrl("https://x.test", PAY, "approve", "admin@example.com"));
  const r = checkReview(q);
  assert.equal(r.ok, true);
  assert.equal(r.p, PAY); assert.equal(r.a, "approve"); assert.equal(r.email, "admin@example.com");
});

test("the link points to the review page of the site", () => {
  assert.match(reviewUrl("https://x.test/", PAY, "reject", "a@b.co"), /^https:\/\/x\.test\/payment-review\?/);
});

test("changing the action turns an approve link into an invalid one", () => {
  const q = parse(reviewUrl("https://x.test", PAY, "approve", "admin@example.com"));
  assert.equal(checkReview({ ...q, a: "reject" }).ok, false);
});

test("changing the payment, the admin or the expiry is refused", () => {
  const q = parse(reviewUrl("https://x.test", PAY, "approve", "admin@example.com"));
  assert.equal(checkReview({ ...q, p: "11111111-1111-4111-8111-111111111111" }).ok, false);
  assert.equal(checkReview({ ...q, u: Buffer.from("other@example.com").toString("base64url") }).ok, false);
  assert.equal(checkReview({ ...q, e: String(Number(q.e) + 100000) }).ok, false);
});

test("a link signed with another secret is refused", () => {
  const q = parse(reviewUrl("https://x.test", PAY, "approve", "admin@example.com"));
  process.env.ADMIN_COOKIE_SECRET = "a-different-secret-a-different-secret";
  assert.equal(checkReview(q).ok, false);
  process.env.ADMIN_COOKIE_SECRET = "test-secret-test-secret-test-secret";
});

test("a link older than 3 days is expired", () => {
  const real = Date.now;
  Date.now = () => real() - 4 * 24 * 3600 * 1000;
  const q = parse(reviewUrl("https://x.test", PAY, "approve", "admin@example.com"));
  Date.now = real;
  const r = checkReview(q);
  assert.equal(r.ok, false); assert.equal(r.reason, "expired");
});

test("garbage and missing values are refused", () => {
  assert.equal(checkReview({}).ok, false);
  assert.equal(checkReview({ p: "x", a: "approve", e: "1", u: "x", s: "x" }).ok, false);
});

test("without a server secret no link is accepted", () => {
  const q = parse(reviewUrl("https://x.test", PAY, "approve", "admin@example.com"));
  delete process.env.ADMIN_COOKIE_SECRET;
  assert.equal(checkReview(q).ok, false);
  process.env.ADMIN_COOKIE_SECRET = "test-secret-test-secret-test-secret";
});
