import QuranShell from "@/components/quran/QuranShell";
import { Section } from "@/components/quran/parts";

// DRAFT: not indexed, not in the sitemap, not linked from the site. Publish (remove noindex, add to sitemap and
// footer) only after the academy has appointed a safeguarding lead and the procedures below really operate.
export const metadata = { title: "Safeguarding and Online Safety Policy (draft)", robots: { index: false, follow: false } };

export default function Safeguarding() {
  return (
    <QuranShell>
      <section className="mx-auto max-w-3xl px-4 pt-10">
        <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">DRAFT for internal review. Not yet approved or in operation. Do not link publicly until every point is true.</p>
        <h1 className="mt-4 font-serif text-3xl font-bold text-[#0b5a3e]">Safeguarding and Online Safety Policy</h1>
      </section>
      <Section title="Responsible person"><p>Safeguarding lead: [name and contact to be appointed].</p></Section>
      <Section title="Before a teacher teaches children">
        <ul className="list-disc space-y-1 pl-5"><li>Identity verification and, where legally possible, background checks, recorded by the academy.</li><li>Qualifications and references checked and documented.</li><li>Teacher agrees in writing to the code of conduct.</li></ul>
      </Section>
      <Section title="How lessons run">
        <ul className="list-disc space-y-1 pl-5"><li>Class links are sent to the parent, who controls access.</li><li>Teachers must not message children privately or arrange lessons or payments with a child. All contact is with the parent.</li><li>Lessons take place on academy-approved platforms only.</li><li>Lessons are monitored as follows: [describe real monitoring].</li><li>Recordings are made only with parent consent: [describe storage and retention].</li></ul>
      </Section>
      <Section title="Reporting a concern"><p>Parents, children and staff can report concerns to [contact]. The lead records every concern, acts promptly and escalates to the relevant authorities where required. [Describe the incident and escalation procedure.]</p></Section>
      <Section title="Privacy"><p>We store only the information needed to run lessons and limit teacher access to what they need. See the privacy policy.</p></Section>
    </QuranShell>
  );
}
