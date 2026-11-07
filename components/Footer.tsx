import Link from "next/link";
import { Logo } from "./Brand";
import { WHATSAPP, WHATSAPP_PRETTY } from "@/lib/contact";
import { Facebook, Instagram } from "lucide-react";

const COLS: { title: string; links: [string, string][] }[] = [
  { title: "Programs", links: [["Character Grooming", "/#programs"], ["Academic Tuition", "/#programs"], ["Enroll Now", "/enroll"]] },
  { title: "Academy", links: [["Why Abu Bakkar Academy", "/#why"], ["Character Development", "/#qualities"], ["The Parent Promise", "/#promise"], ["How It Works", "/#journey"]] },
  { title: "Support", links: [["FAQs", "/#faq"], ["Privacy Policy", "/privacy"], ["Refund Policy", "/refund-policy"], ["Terms of Enrollment", "/terms"]] },
];

export default function Footer() {
  const wa = WHATSAPP;
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const fb = process.env.NEXT_PUBLIC_FACEBOOK_URL;
  const ig = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
  const pretty = WHATSAPP_PRETTY;
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-6xl px-5 pt-14">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[15px] leading-relaxed">
              Online Character Grooming &amp; Academic Tuition. Sirf Taleem Nahi, Tarbiyat Bhi.
            </p>
            {(fb || ig) && (
              <div className="mt-5 flex gap-3">
                {fb && <a href={fb} target="_blank" rel="noopener" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 hover:border-gold hover:text-gold"><Facebook size={16} /></a>}
                {ig && <a href={ig} target="_blank" rel="noopener" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 hover:border-gold hover:text-gold"><Instagram size={16} /></a>}
              </div>
            )}
          </div>

          {COLS.map((c) => (
            <div key={c.title}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{c.title}</p>
              <ul className="mt-5 space-y-3 text-[15px]">
                {c.links.map(([l, h]) => <li key={l}><Link href={h} className="hover:text-navy">{l}</Link></li>)}
              </ul>
              {c.title === "Support" && (wa || email) && (
                <div className="mt-5 space-y-1 text-[15px]">
                  {wa && <p>WhatsApp: <a href={`https://wa.me/${wa}`} className="hover:text-navy">{pretty}</a></p>}
                  {email && <p><a href={`mailto:${email}`} className="hover:text-navy">{email}</a></p>}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-slate-200 py-6 text-xs text-slate-500 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Abu Bakkar Academy. All rights reserved.</p>
          <p className="md:max-w-xl md:text-right">
            Independent online academy — not affiliated with, endorsed by, or connected to any television channel, drama production or its cast.
          </p>
        </div>
      </div>
    </footer>
  );
}
