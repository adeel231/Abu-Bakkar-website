// DISPLAY-ONLY fallback, used when the database cannot be reached so the marketing pages never look broken.
// Checkout never uses these numbers: the enrollment page refuses to run on them and the price is always read from the database.
import type { AgeGroup, Pkg } from "./pricing";
import type { Program, Subject } from "./db";

export const DEFAULT_PROGRAMS: Program[] = [
  { id: "d-cg", slug: "character-grooming", name: "Character Grooming", kind: "character", is_main: true, tagline: "Our main program", status: "open", sort: 1, sessions: 0, duration_weeks: 4, age_group: "Ages 5–15",
    description: "Live online classes that build respect, honesty, patience, kindness and confidence, with Islamic manners and practical activities." },
  { id: "d-at", slug: "academic-tuition", name: "Academic Tuition", kind: "tuition", is_main: false, tagline: "Second service", status: "open", sort: 2, sessions: 12, duration_weeks: 4, age_group: "Grades 1–10",
    description: "Online tuition for school subjects with study skills, taught separately from Character Grooming." },
];

const pk = (id: string, program_id: string, class_type: "group" | "private", duration_key: string, label: string, months: number, price_pkr: number, sessions: number | null, schedule_note: string, sort: number): Pkg =>
  ({ id, program_id, class_type, duration_key, label, months, price_pkr, sessions, schedule_note, sort, active: true });

export const DEFAULT_PACKAGES: Pkg[] = [
  pk("d1", "d-cg", "group", "monthly", "Monthly", 1, 6000, null, "1 hour daily · 5 days per week", 1),
  pk("d2", "d-cg", "group", "3m", "3 Months", 3, 16500, null, "1 hour daily · 5 days per week", 2),
  pk("d3", "d-cg", "group", "6m", "6 Months", 6, 30000, null, "1 hour daily · 5 days per week", 3),
  pk("d4", "d-cg", "private", "monthly", "Monthly", 1, 13000, null, "1 hour per session · 2 days per week", 4),
  pk("d5", "d-cg", "private", "3m", "3 Months", 3, 36000, null, "1 hour per session · 2 days per week", 5),
  pk("d6", "d-cg", "private", "6m", "6 Months", 6, 69000, null, "1 hour per session · 2 days per week", 6),
  pk("d7", "d-at", "group", "4w", "4 Weeks", 1, 5999, 12, "12 sessions over 4 weeks", 7),
  pk("d8", "d-at", "private", "4w", "4 Weeks", 1, 15999, 12, "12 sessions over 4 weeks", 8),
];

export const DEFAULT_AGE_GROUPS: AgeGroup[] = [
  { id: "d-a", code: "A", label: "Group A", min_age: 5, max_age: 8, focus: "Manners and kindness", sort: 1, active: true },
  { id: "d-b", code: "B", label: "Group B", min_age: 8, max_age: 12, focus: "Respect and patience", sort: 2, active: true },
  { id: "d-c", code: "C", label: "Group C", min_age: 12, max_age: 15, focus: "Responsibility and emotional intelligence", sort: 3, active: true },
];

export const DEFAULT_SUBJECTS: Subject[] = ["Mathematics", "English", "Urdu", "Science", "Islamiyat", "Computer Science"]
  .map((name, i) => ({ id: "d-s" + i, name, sort: i + 1, active: true }));
