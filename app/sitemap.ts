import type { MetadataRoute } from "next";
import { SERVICES, SITE } from "@/lib/quran";

// Indexable public pages only. Admin, enrolment, payment and confirmation pages are excluded.
const PATHS = ["/", "/services", "/services/academic-tutoring", "/privacy", "/refund-policy", "/terms",
  "/quran", "/quran/uk", "/quran/usa", "/quran/kids", "/quran/female-teachers", "/quran/pricing", "/quran/book-trial", "/quran/teachers",
  ...Object.values(SERVICES).map((s) => s.page.path)];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((p) => ({ url: `${SITE}${p === "/" ? "" : p}` }));
}
