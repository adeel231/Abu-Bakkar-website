"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarClock, CreditCard, LayoutDashboard, Settings, Tags, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const NAV: [string, string, LucideIcon][] = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/payments", "Payments", CreditCard],
  ["/admin/enrollments", "Enrollments", BookOpen],
  ["/admin/people", "Parents & Students", Users],
  ["/admin/batches", "Class Batches", CalendarClock],
  ["/admin/packages", "Packages & Pricing", Tags],
  ["/admin/settings", "Settings", Settings],
];

const isActive = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

/** Sidebar links (desktop) or a scrolling chip row (mobile). `pending` = payments waiting for verification. */
export default function AdminNav({ pending, variant }: { pending: number; variant: "side" | "top" }) {
  const path = usePathname() || "/admin";

  if (variant === "top") {
    return (
      <nav className="flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
        {NAV.map(([href, label, Icon]) => {
          const on = isActive(path, href);
          return (
            <Link key={href} href={href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${on ? "bg-gold text-navy" : "bg-white/10 text-white/85 hover:bg-white/15"}`}>
              <Icon size={15} />{label}
              {href === "/admin/payments" && pending > 0 && <span className="rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">{pending}</span>}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1 px-3">
      {NAV.map(([href, label, Icon]) => {
        const on = isActive(path, href);
        return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${on ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
            {on && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-gold" aria-hidden />}
            <Icon size={18} className={on ? "text-gold" : "text-white/60 group-hover:text-white/90"} />
            <span className="flex-1">{label}</span>
            {href === "/admin/payments" && pending > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white" title={`${pending} waiting for verification`}>{pending}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
