"use client";
import { adEvent } from "@/components/Analytics";

/** WhatsApp link that fires the whatsapp_click event (no personal data). */
export default function WhatsAppLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener" className={className} onClick={() => adEvent("Contact", { channel: "whatsapp", service: "quran" }, "whatsapp_click")}>{children}</a>;
}
