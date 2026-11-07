"use client";
import { MessageCircle } from "lucide-react";
import { WHATSAPP } from "@/lib/contact";
import { useEffect, useState } from "react";
import { EnrollLink, track } from "./Tracker";
import { Logo } from "./Brand";

const NAV = [["#why", "Why Us"], ["#packages", "Packages"], ["#tuition", "Tuition"], ["#journey", "How It Works"], ["#faq", "FAQs"]];
const wa = WHATSAPP;

export function AnnouncementBar({ href, limited, price }: { href: string; limited: boolean; price: string }) {
  return (
    <div className="sticky top-0 z-50 bg-gold text-navy">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center text-xs font-medium tracking-wide sm:text-sm">
        Online Character Grooming from {price} / month{limited ? " — Limited seats available." : "."}{" "}
        <EnrollLink href={href} className="underline">Enroll now</EnrollLink>
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
    <header className={`sticky top-9 z-40 border-b border-slate-200 transition ${scrolled ? "bg-white shadow-sm" : "bg-white"}`}>
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

/** Floating WhatsApp button + persistent bottom enroll bar on mobile. */
export function FloatingBar({ href }: { href: string }) {
  return (
    <>
      {wa && (
        <a href={`https://wa.me/${wa}?text=${encodeURIComponent("Assalamu Alaikum, I have a question about Abu Bakkar Academy.")}`}
          target="_blank" rel="noopener" aria-label="Chat on WhatsApp" onClick={() => track("enroll_click")}
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl md:bottom-6"><MessageCircle size={28} /></a>
      )}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
        <EnrollLink href={href} className="btn-gold w-full">ENROLL NOW</EnrollLink>
      </div>
    </>
  );
}
