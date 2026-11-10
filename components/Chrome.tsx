"use client";
import { WHATSAPP } from "@/lib/contact";
import { useEffect, useState } from "react";
import { EnrollLink, track } from "./Tracker";
import { Logo } from "./Brand";

const NAV = [["#packages", "Packages"], ["#journey", "How It Works"], ["#faq", "FAQs"]];
const wa = WHATSAPP;

const PHONE = "03335767202";

export function AnnouncementBar() {
  return (
    <div className="bg-gold text-navy">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center text-sm font-semibold tracking-wide sm:text-lg">
        For admission details call us{" "}
        <a href={`tel:${PHONE}`} className="whitespace-nowrap font-extrabold underline">{PHONE}</a>
      </p>
    </div>
  );
}

export function Header({ href }: { href: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 10);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <header className={`border-b border-slate-200 transition ${scrolled ? "bg-white shadow-sm" : "bg-white"}`}>
      <div className="mx-auto flex w-full items-center justify-between px-5 py-1 md:px-6">
        <Logo />
        <nav className="hidden items-center gap-4 text-sm font-medium text-navy md:flex lg:gap-7 lg:text-base">
          {NAV.map(([h, l]) => <a key={h} href={h} className="transition-colors hover:text-emerald-700">{l}</a>)}
          <EnrollLink href={href} className="btn-gold !px-5 !py-2.5 text-sm lg:!px-6 lg:text-[15px]">Enroll Now</EnrollLink>
        </nav>
        <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-lg p-2 text-navy md:hidden">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"} /></svg>
        </button>
      </div>
      {open && (
        <nav className="space-y-1 border-t border-slate-200 px-5 pb-4 md:hidden">
          {NAV.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)} className="block py-2.5 text-base font-medium text-navy">{l}</a>)}
        </nav>
      )}
    </header>
  );
}

/** The WhatsApp glyph, so the button is recognised at a glance. */
export const WhatsAppIcon = ({ className = "h-9 w-9 md:h-10 md:w-10" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.43-9.43 2.52 0 4.88.98 6.66 2.77a9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.43 9.43zm8.02-17.45A11.3 11.3 0 0 0 12.05.75C5.8.75.72 5.83.72 12.08c0 2 .52 3.95 1.51 5.67L.63 23.25l5.63-1.48a11.3 11.3 0 0 0 5.78 1.47h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.32-8.01z"/>
  </svg>
);

/** Floating WhatsApp button + persistent bottom enroll bar on mobile. */
export function FloatingBar({ href }: { href: string }) {
  return (
    <>
      {wa && (
        <a href={`https://wa.me/${wa}?text=${encodeURIComponent("Assalamu Alaikum, I have a question about Abu Bakkar Academy.")}`}
          target="_blank" rel="noopener" aria-label="Chat on WhatsApp" onClick={() => track("enroll_click")}
          className="fixed bottom-20 right-4 z-40 flex h-16 w-16 items-center md:h-[72px] md:w-[72px] justify-center rounded-full bg-[#25D366] text-white shadow-xl ring-[3px] ring-white transition hover:scale-105 md:bottom-6 md:right-6"><WhatsAppIcon /></a>
      )}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <EnrollLink href={href} className="btn-gold w-full">ENROLL NOW</EnrollLink>
      </div>
    </>
  );
}
