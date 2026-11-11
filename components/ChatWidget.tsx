"use client";
import { Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { adEvent } from "./Analytics";
import { WhatsAppIcon } from "./Chrome";

type Msg = { role: "user" | "assistant"; text: string; error?: boolean };
const KEY = "aba_chat";
const CHIPS = ["What are the fees?", "Which age group fits my child?", "How do I enroll?", "How do I pay?", "What is the refund policy?"];

/** Chat-bubble robot face on a green gradient tile (the assistant's icon). */
function BotIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs><linearGradient id="aba-bot" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7cb83e" /><stop offset="1" stopColor="#5bc0cf" /></linearGradient></defs>
      <rect width="100" height="100" rx="24" fill="url(#aba-bot)" />
      <path d="M41 26a9 9 0 0 1 9-5h0a9 9 0 0 1 9 5z" fill="#fff" />
      <path d="M17 52a8 14 0 0 1 8-15v28a8 14 0 0 1-8-13zM83 52a8 14 0 0 0-8-15v28a8 14 0 0 0 8-13z" fill="#fff" />
      <path d="M50 28c17 0 27 10 27 24 0 14-10 22-27 22H40l-13 12 2-14c-5-4-6-10-6-20 0-14 10-24 27-24z" fill="#fff" />
      <rect x="36" y="41" width="11" height="11" rx="1.5" fill="none" stroke="#6bbf8a" strokeWidth="3" />
      <rect x="55" y="41" width="11" height="11" rx="1.5" fill="none" stroke="#6bbf8a" strokeWidth="3" />
      <path d="M44 62h14" stroke="#6bbf8a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** The academy assistant: a floating button that opens a chat window. Answers come from /api/chat. */
export default function ChatWidget({ phone, whatsapp }: { phone: string; whatsapp: string }) {
  const path = usePathname();
  const greeting: Msg = {
    role: "assistant",
    text: "Assalamu Alaikum! I am the Abu Bakkar Academy assistant. Ask me about fees and age groups and classes and enrollment and payment. Aap English ya Roman Urdu mein pooch sakte hain. Please do not share your child's personal details here.",
  };
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([greeting]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState<string | null>(null);        // text of the reply being revealed
  const [shown, setShown] = useState(0);
  const [loaded, setLoaded] = useState(false);                      // saved conversation has been read (do not save before this)
  const end = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  // remember the conversation while this tab stays open
  useEffect(() => {
    try { const raw = sessionStorage.getItem(KEY); if (raw) { const m = JSON.parse(raw) as Msg[]; if (Array.isArray(m) && m.length) setMsgs(m); } } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch {} } }, [msgs, loaded]);

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, typing, shown, busy, open]);
  useEffect(() => { if (open) setTimeout(() => field.current?.focus(), 50); }, [open]);
  useEffect(() => { // Escape closes
    if (!open) return;
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", f); return () => document.removeEventListener("keydown", f);
  }, [open]);

  // reveal a reply a few letters at a time, like it is being typed
  useEffect(() => {
    if (typing === null) return;
    if (shown >= typing.length) { setMsgs((m) => [...m, { role: "assistant", text: typing }]); setTyping(null); setShown(0); return; }
    const t = setTimeout(() => setShown((n) => Math.min(typing.length, n + 4)), 16);
    return () => clearTimeout(t);
  }, [typing, shown]);

  if (path?.startsWith("/admin")) return null;

  async function send(raw: string) {
    const text = raw.trim().slice(0, 500);
    if (!text || busy || typing !== null) return;
    const next: Msg[] = [...msgs, { role: "user", text }];
    setMsgs(next); setInput(""); setBusy(true);
    if (!msgs.some((m) => m.role === "user")) { try { adEvent("ChatStarted", { method: "assistant" }, "chat_started"); } catch {} }
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.text })) }),
        signal: AbortSignal.timeout(35_000),
      });
      const j = await r.json().catch(() => ({}));
      if (typeof j.reply === "string" && j.reply) {
        if (r.ok) { setTyping(j.reply); setShown(0); } else setMsgs((m) => [...m, { role: "assistant", text: j.reply, error: true }]);
      } else throw new Error("no reply");
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: `Sorry I could not answer right now. Please message our team on WhatsApp ${phone}.`, error: true }]);
    } finally { setBusy(false); }
  }

  const wa = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Assalamu Alaikum, I have a question about Abu Bakkar Academy.")}`;
  const started = msgs.some((m) => m.role === "user");

  return (
    <>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} aria-label="Ask the academy assistant"
          className="fixed bottom-40 right-4 z-40 h-14 w-14 overflow-hidden rounded-2xl shadow-xl ring-[3px] ring-white transition hover:scale-105 md:bottom-[7.25rem] md:right-6 md:h-16 md:w-16">
          <BotIcon className="h-full w-full" />
        </button>
      )}

      {open && (
        <div role="dialog" aria-label="Abu Bakkar Academy assistant"
          className="fixed inset-x-2 bottom-2 top-16 z-[60] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 md:inset-x-auto md:bottom-6 md:right-6 md:left-auto md:top-auto md:h-[34rem] md:w-[24rem]">
          <div className="flex items-center justify-between bg-gradient-to-r from-[#052a1f] to-[#0b5a3e] px-4 py-3 text-white">
            <div className="leading-tight"><p className="font-serif text-lg font-bold">Abu Bakkar Academy</p><p className="text-xs text-gold">Assistant</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-2 hover:bg-white/10"><X size={20} /></button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f6f8f6] px-3 py-4" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <p className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug ${m.role === "user" ? "rounded-br-md bg-[#0b5a3e] text-white" : "rounded-bl-md bg-white text-navy shadow-sm ring-1 ring-slate-200"}`}>{m.text}</p>
              </div>
            ))}
            {typing !== null && (
              <div className="flex justify-start"><p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[15px] leading-snug text-navy shadow-sm ring-1 ring-slate-200">{typing.slice(0, shown)}</p></div>
            )}
            {busy && (
              <div className="flex justify-start" aria-label="The assistant is typing">
                <span className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  {[0, 1, 2].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d * 0.15}s` }} />)}
                </span>
              </div>
            )}
            {!started && (
              <div className="flex flex-wrap gap-2 pt-1">
                {CHIPS.map((c) => <button key={c} type="button" onClick={() => send(c)} className="rounded-full border border-[#0b5a3e]/30 bg-white px-3 py-1.5 text-sm font-medium text-[#0b5a3e] hover:bg-emerald-50">{c}</button>)}
              </div>
            )}
            <div ref={end} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2">
              <input ref={field} value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="Type your question..." aria-label="Your question"
                className="min-w-0 flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-base focus:border-emerald focus:outline-none focus:ring-4 ring-emerald/20" />
              <button type="submit" disabled={!input.trim() || busy || typing !== null} aria-label="Send" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0b5a3e] text-white disabled:opacity-40"><Send size={18} /></button>
            </form>
            <a href={wa} target="_blank" rel="noopener" className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:brightness-105">
              <WhatsAppIcon className="h-5 w-5" /> Talk to our team on WhatsApp
            </a>
            <p className="mt-2 text-center text-[11px] text-slate-500">AI assistant. Our team confirms anything important on WhatsApp.</p>
          </div>
        </div>
      )}
    </>
  );
}
