import LegalPage from "@/components/LegalPage";
export const metadata = { title: "Refund & Cancellation Policy — Abu Bakkar Academy" };

export default function Refund() {
  return (
    <LegalPage title="Refund Policy">
      <h2>Class does not start</h2>
      <p>If we cannot start the batch, you get your <b>full money back</b>.</p>
      <h2>You cancel before the first class</h2>
      <p>You get your <b>full money back</b>.</p>
      <h2>You cancel after classes start</h2>
      <p>No refund, because the seat is already used.</p>
      <h2>We miss a class</h2>
      <p>We will give you a make-up class.</p>
      <h2>How to ask for a refund</h2>
      <p>Send us a WhatsApp message with your Enrollment ID. We will send your money back within 7 working days.</p>
      <h2>When is your seat confirmed?</h2>
      <p>After we check your payment. Until then, your seat is not confirmed.</p>
    </LegalPage>
  );
}
