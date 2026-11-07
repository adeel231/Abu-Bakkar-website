import LegalPage from "@/components/LegalPage";
export const metadata = { title: "Privacy Policy — Abu Bakkar Academy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>Abu Bakkar Academy (“we”) provides online classes for children. Parents or guardians enroll on their child’s behalf. This policy explains what we collect and why.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Parent: full name, WhatsApp number, optional email, city.</li>
        <li>Child: first name, age and grade only — needed to place them in the right class.</li>
        <li>Payment: method, transaction ID and amount, to verify your payment. We never see card or wallet PINs.</li>
        <li>Anonymous site analytics: pages viewed and the campaign you came from.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To process enrollment and payment, send joining instructions and receipts, deliver classes, give parents progress feedback and improve the academy.</p>
      <h2>Advertising and analytics</h2>
      <p>With your consent only, we use Google Analytics 4 and the Meta Pixel to measure our advertising. <b>We do not send your name, your child’s details, phone number or email to advertising platforms.</b> Only anonymous events (such as “page viewed” or “enrollment completed” with the amount) are shared. You can decline cookies and still enroll.</p>
      <h2>Sharing</h2>
      <p>We do not sell personal data. It is stored with our database provider (Supabase) and shared only with service providers needed to run the academy (e.g. messaging, video-class tools).</p>
      <h2>Retention and your rights</h2>
      <p>We keep enrollment records while needed for service and legal reasons. You may request access, correction or deletion by contacting us on WhatsApp or email.</p>
      <h2>Children</h2>
      <p>We collect children’s information only from a parent or guardian who has given consent on the enrollment form.</p>
    </LegalPage>
  );
}
