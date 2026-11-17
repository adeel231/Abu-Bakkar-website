// International Quran service: plans, markets and page content. Prices are launch prices awaiting final approval.
export const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abubakkaracademy.com";

export type Region = "uk" | "us";
export const REGIONS: Record<Region, { label: string; currency: string; symbol: string; path: string; hreflang: string; zoneNote: string }> = {
  uk: { label: "United Kingdom", currency: "GBP", symbol: "£", path: "/quran/uk", hreflang: "en-GB", zoneNote: "Lesson times are shown in UK time (GMT in winter, BST in summer)." },
  us: { label: "United States", currency: "USD", symbol: "$", path: "/quran/usa", hreflang: "en-US", zoneNote: "Lesson times are confirmed in your own US time zone when we book your assessment." },
};

export type Plan = { key: string; name: string; sessions: number; minutes: number; price: Record<Region, number>; recommended?: boolean; hifz?: boolean };
export const PLANS: Plan[] = [
  { key: "starter", name: "Starter", sessions: 8, minutes: 30, price: { uk: 35, us: 49 } },
  { key: "standard", name: "Standard", sessions: 12, minutes: 30, price: { uk: 45, us: 65 }, recommended: true },
  { key: "intensive", name: "Intensive", sessions: 20, minutes: 30, price: { uk: 69, us: 99 } },
  { key: "hifz", name: "Hifz Intensive", sessions: 20, minutes: 45, price: { uk: 89, us: 129 }, hifz: true },
];
/** Brief rule 10: show Hifz pricing only once qualified specialist teachers are available. Set NEXT_PUBLIC_QURAN_HIFZ_LIVE=true to show it. */
export const HIFZ_LIVE = process.env.NEXT_PUBLIC_QURAN_HIFZ_LIVE === "true";
export const visiblePlans = () => PLANS.filter((p) => !p.hifz || HIFZ_LIVE);
export const money = (r: Region, n: number) => `${REGIONS[r].symbol}${n}`;

export const LEVELS = ["Complete beginner (no Arabic letters yet)", "Knows the letters (Noorani Qaida)", "Reads the Quran slowly (Nazra)", "Reads fluently, wants Tajweed", "Memorising (Hifz)", "Not sure"];
export const AGE_BANDS = ["4–6", "7–9", "10–12", "13–17", "Adult (18+)"];
export const TEACHER_PREFS = ["No preference", "Female teacher (Qaria)", "Male teacher (Qari)"];

export type SeoPage = { path: string; title: string; description: string; h1: string; priority: "P0" | "P1" | "P2" };

export const COMMON_FAQ: [string, string][] = [
  ["Is the first assessment free?", "Yes. It takes 20–30 minutes and needs no card details."],
  ["Are lessons one-to-one?", "Yes, live over video with one teacher."],
  ["Where are your teachers based?", "Online from Pakistan, at times that suit your time zone."],
  ["Can I choose a female teacher?", "Yes. Ask when you book and we confirm availability before you pay."],
];

/** Service pages (P1/P2). Copy stays factual; no claims we cannot yet prove. */
export const SERVICES: Record<string, { page: SeoPage; intro: string; points: string[]; faq: [string, string][] }> = {
  "noorani-qaida": {
    page: { path: "/quran/noorani-qaida", title: "Online Noorani Qaida Classes | 1-to-1 Beginner Quran", description: "Live one-to-one online Noorani Qaida classes for beginners. Learn Arabic letters and basic reading step by step. Free assessment.", h1: "Online Noorani Qaida Classes for Beginners", priority: "P1" },
    intro: "Noorani Qaida is the first step for children and adults who cannot yet read Arabic letters.",
    points: ["Letters and their correct sounds (makharij)", "Short and long vowels, tanween and sukoon", "Joined letters and simple words", "Short progress check by the teacher"],
    faq: [["What age can a child start Noorani Qaida?", "Many children start from around 4–5 years old. We confirm the right starting point in the free assessment."], ["How long does Noorani Qaida take?", "It depends on the child and how often they practise. The teacher gives an honest estimate after the assessment."]],
  },
  nazra: {
    page: { path: "/quran/nazra", title: "Online Nazra Quran Reading Lessons | 1-to-1", description: "Learn to read the Quran fluently with live one-to-one online Nazra lessons and gentle correction. Book a free assessment.", h1: "Online Quran Reading (Nazra) Lessons", priority: "P1" },
    intro: "Nazra lessons help students who know the letters to read the Quran fluently.",
    points: ["Reading from the Quran with correction", "Building fluency and confidence", "Introduction to basic Tajweed rules", "Clear next steps after each lesson"],
    faq: [["Is Nazra different from Noorani Qaida?", "Yes. Qaida teaches letters and basic reading. Nazra is reading the Quran itself."]],
  },
  tajweed: {
    page: { path: "/quran/tajweed", title: "Online Tajweed Classes | Learn Tajweed 1-to-1", description: "Improve Quran pronunciation with live one-to-one online Tajweed classes for children and adults. Free assessment.", h1: "Online Tajweed Classes", priority: "P1" },
    intro: "Tajweed lessons improve pronunciation and recitation for students who can already read the Quran.",
    points: ["Correct pronunciation of letters", "Rules such as Ghunnah, Qalqalah, Ikhfa and Idgham", "Live correction while reciting", "Practice tasks between lessons"],
    faq: [["Do I need to read fluently first?", "Students should be able to read the Quran slowly. If not, we start with Nazra."]],
  },
  hifz: {
    page: { path: "/quran/hifz", title: "Online Hifz Classes | Quran Memorisation Tutor", description: "One-to-one online Quran memorisation (Hifz) with a regular revision plan. Book a free assessment to check readiness.", h1: "Online Hifz Classes", priority: "P1" },
    intro: "Hifz needs steady daily effort and careful revision.",
    points: ["Readiness assessment", "New lesson and revision plan", "Parent progress updates", "Hifz students are placed only when a qualified specialist teacher is available"],
    faq: [["Is Hifz available now?", "Hifz places depend on specialist teacher availability. Book an assessment and we will confirm honestly."]],
  },
  adults: {
    page: { path: "/quran/adults", title: "Quran Classes for Adults | Beginner Quran Lessons Online", description: "Private online Quran lessons for adult beginners and revert students. Flexible one-to-one lessons. Free assessment.", h1: "Online Quran Classes for Adults", priority: "P2" },
    intro: "Private, patient lessons for adults who are starting from the beginning or want to improve their recitation.",
    points: ["Beginner-friendly and private", "Lesson times that fit around work", "Qaida, Nazra or Tajweed", "Female teachers for women, subject to availability"],
    faq: [["Can I learn from scratch as an adult?", "Yes. Many students start with no Arabic at all."]],
  },
};

export const LEAD_STATUSES = ["new_inquiry", "trial_booked", "trial_attended", "package_recommended", "payment_pending", "paying_student", "retained", "cancelled"] as const;
export const LEAD_LABEL: Record<string, string> = {
  new_inquiry: "New Inquiry", trial_booked: "Trial Booked", trial_attended: "Trial Attended", package_recommended: "Package Recommended",
  payment_pending: "Payment Pending", paying_student: "Paying Student", retained: "Retained", cancelled: "Cancelled",
};
