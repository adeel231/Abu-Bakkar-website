import type { MetadataRoute } from "next";
import { SITE } from "@/lib/quran";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/pay/", "/confirmation/", "/payment-review"] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
