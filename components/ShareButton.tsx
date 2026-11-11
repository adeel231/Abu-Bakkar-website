"use client";
import { Check, Facebook, Link2, Send, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { adEvent } from "./Analytics";
import { myReferralCode, track } from "./Tracker";

type Props = {
  /** Section id. The shared link opens the page scrolled to this section. */
  id: string;
  title: string;
  /** One or two short sentences about the section. Never include child or enrollment details. */
  text: string;
  /** "dark" for sections with a dark background. */
  tone?: "light" | "dark";
  /** Pins the button inside its (relative) section. Leave empty to place it inline. */
  corner?: "top-right" | "bottom-right";
};

const PIN = { "top-right": "absolute right-3 top-3 z-20 md:right-5 md:top-4", "bottom-right": "absolute bottom-3 right-3 z-20 md:bottom-4 md:right-5" };

/** A small "Share" pill for one section. Phones open the phone's own share sheet; computers open a small menu. */
export default function ShareButton({ id, title, text, tone = "light", corner }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Anonymous referral code + section id only: no child or enrollment information ever goes into a shared link.
  const link = () => `${location.origin}/?rf=${myReferralCode()}&utm_source=share&utm_medium=section&utm_content=${encodeURIComponent(id)}#${id}`;

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent | TouchEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away); document.addEventListener("touchstart", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  async function onShare() {
    const touch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
    if (touch && typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: link() });
        track("share_native", { section: id, rf: myReferralCode() }); adEvent("Share", { method: "native", section: id });
      } catch { /* the person closed the share sheet */ }
      return;
    }
    setOpen((o) => !o);
  }
  function whatsapp() {
    track("share_whatsapp", { section: id, rf: myReferralCode() }); adEvent("Share", { method: "whatsapp", section: id });
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${text}\n\n${link()}`)}`, "_blank", "noopener");
    setOpen(false);
  }
  function facebook() {
    track("share_facebook", { section: id, rf: myReferralCode() }); adEvent("Share", { method: "facebook", section: id });
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link())}&quote=${encodeURIComponent(text)}`, "_blank", "noopener");
    setOpen(false);
  }
  async function copy() {
    const url = link();
    try { await navigator.clipboard.writeText(url); }
    catch { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch {} t.remove(); }
    track("share_copy", { section: id, rf: myReferralCode() }); adEvent("Share", { method: "copy", section: id });
    setCopied(true); setTimeout(() => { setCopied(false); setOpen(false); }, 1400);
  }

  const pill = tone === "dark"
    ? "bg-white/15 text-white ring-1 ring-white/40 backdrop-blur hover:bg-white/25"
    : "bg-white text-navy ring-1 ring-slate-200 shadow-sm hover:bg-slate-50";
  const item = "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy hover:bg-slate-100";

  return (
    <div ref={box} className={`${corner ? PIN[corner] : "relative inline-block"} text-left`}>
      <button type="button" onClick={onShare} aria-haspopup="menu" aria-expanded={open} aria-label={`Share: ${title}`}
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${pill}`}>
        <Share2 size={15} /> Share
      </button>
      {open && (
        <div role="menu" className={`absolute right-0 z-30 w-56 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-slate-200 ${corner === "bottom-right" ? "bottom-full mb-2" : "top-full mt-2"}`}>
          <button role="menuitem" type="button" onClick={whatsapp} className={item}><Send size={17} className="text-[#1f9a4d]" />WhatsApp</button>
          <button role="menuitem" type="button" onClick={facebook} className={item}><Facebook size={17} className="text-[#1b6fe0]" />Facebook</button>
          <button role="menuitem" type="button" onClick={copy} className={item}>
            {copied ? <Check size={17} className="text-emerald-600" /> : <Link2 size={17} className="text-slate-500" />}{copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
