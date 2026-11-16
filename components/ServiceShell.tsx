import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Footer from "./Footer";
import { AnnouncementBar, FloatingBar, Header } from "./Chrome";

/** Shared frame for the services pages: top strip + menu, optional "All services" link, footer. */
export default function ServiceShell({ children, back = false }: { children: React.ReactNode; back?: boolean }) {
  const enrollHref = "/enroll";
  return (
    <main>
      <div className="sticky top-0 z-50">
        <AnnouncementBar />
        <Header href={enrollHref} />
      </div>
      {back && (
        <div className="mx-auto max-w-6xl px-5 pt-6">
          <Link href="/services" className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"><ChevronLeft size={18} /> All services</Link>
        </div>
      )}
      {children}
      <Footer />
      <FloatingBar href={enrollHref} />
    </main>
  );
}
