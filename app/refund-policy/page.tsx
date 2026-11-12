import LegalPage from "@/components/LegalPage";
import { getCatalog } from "@/lib/db";
import { formatPKR, monthlyPackage, plan } from "@/lib/pricing";

export const metadata = { title: "Refund Policy — Abu Bakkar Academy" };
export const dynamic = "force-dynamic";

export default async function Refund() {
  const c = await getCatalog();
  const cg = c.programs.find((p) => p.kind === "character");
  const gm = cg ? monthlyPackage(c.packages, cg.id, "group") : undefined;
  const pm = cg ? monthlyPackage(c.packages, cg.id, "private") : undefined;
  const g6 = cg ? plan(c.packages, cg.id, "group").find((p) => p.months === 6) : undefined;
  const p3 = cg ? plan(c.packages, cg.id, "private").find((p) => p.months === 3) : undefined;

  return (
    <LegalPage title="Refund Policy">
      <h2>If we cannot start your class</h2>
      <p>You get your <b>full money back</b>, for every package.</p>

      <h2>If you cancel before the first class</h2>
      <p>You get your <b>full money back</b>, for every package.</p>

      <h2>Monthly package, after classes have started</h2>
      <p>The month that has started is not refunded. You can stop any time, and you will not be charged again.</p>

      <h2>3-month and 6-month advance packages, after classes have started</h2>
      <p>The months that have already started are counted at the <b>regular monthly price</b>
        {gm && pm ? <> ({formatPKR(gm.price_pkr)} for Online Group, {formatPKR(pm.price_pkr)} for Private One-on-One)</> : null}.
        We refund the full months that are left.</p>
      <ul>
        {g6 && gm && <li><b>Example:</b> 6 months Online Group ({formatPKR(g6.price_pkr)}). You stop during month 2. Months used: 2 × {formatPKR(gm.price_pkr)} = {formatPKR(2 * gm.price_pkr)}. Refund: {formatPKR(g6.price_pkr - 2 * gm.price_pkr)}.</li>}
        {p3 && pm && <li><b>Example:</b> 3 months Private One-on-One ({formatPKR(p3.price_pkr)}). You stop during month 1. Months used: 1 × {formatPKR(pm.price_pkr)}. Refund: {formatPKR(p3.price_pkr - pm.price_pkr)}.</li>}
      </ul>

      <h2>Academic Tuition (per month, 12 sessions)</h2>
      <p>Full refund before the first session. After the first session there is no refund, but if we miss a session we give you a make-up session.</p>

      <h2>If we miss a class</h2>
      <p>We will give you a make-up class.</p>

      <h2>How to ask for a refund</h2>
      <p>Send us a WhatsApp message with your Enrollment ID. We send the money back to the account you paid from within 7 working days.</p>

      <h2>When is your seat confirmed?</h2>
      <p>After we check your payment in our account. Until then your seat is not confirmed.</p>
    </LegalPage>
  );
}
