/** Homepage section ids (used in shared links) and the names shown in the admin dashboard. */
export const SECTION_LABELS: Record<string, string> = {
  hero: "Top banner",
  qualities: "Character Development",
  programs: "Program banner",
  packages: "Packages",
  "age-groups": "Age groups",
  teachers: "Teachers",
  hadith: "Hadith",
  promise: "Parent Promise",
  play: "Response Challenge game",
  journey: "How it works",
  faq: "Parent FAQs",
  join: "Final enroll section",
};
export const sectionName = (id: string) => SECTION_LABELS[id] ?? id;
