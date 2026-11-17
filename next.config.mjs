/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // The old Quran page was replaced by /quran; keep any existing links and rankings working.
  async redirects() { return [{ source: "/services/quran", destination: "/quran", permanent: true }]; },
  distDir: process.env.NEXT_DIST_DIR || ".next",   // tests use their own folder so they never disturb a running dev server
};
