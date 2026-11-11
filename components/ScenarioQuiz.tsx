"use client";
import { ArrowRight, RotateCcw, Send } from "lucide-react";
import { useRef, useState } from "react";
import { adEvent } from "./Analytics";
import { EnrollLink, myReferralCode, track } from "./Tracker";

type Option = { text: string; why?: string };
type Scenario = { situation: string; ask: string; options: Option[]; right: number; title: string; lines: string[] };

// Copy rule for this site: no commas.
const SCENARIOS: Scenario[] = [
  {
    situation: "Someone insults your child in front of friends.", ask: "What should your child do?", right: 2,
    options: [
      { text: "Get angry and insult them back", why: "Anger feeds the fight. Insulting back turns a small moment into a big problem." },
      { text: "Stay silent and accept everything", why: "Silence is not the answer either. Your child’s feelings and dignity matter too." },
      { text: "Stay calm and respond confidently" },
    ],
    title: "That’s the Abu Bakkar Way!",
    lines: ["Sabr ka matlab kamzori nahi.", "Asal himmat apne jazbaat par control aur izzat ke saath jawab dena hai."],
  },
  {
    situation: "Your child makes a mistake.", ask: "What should they do?", right: 2,
    options: [
      { text: "Blame someone else", why: "Blaming others avoids the problem and slowly breaks trust." },
      { text: "Hide the mistake", why: "A hidden mistake usually grows bigger and the worry stays inside the child." },
      { text: "Accept responsibility and make things right" },
    ],
    title: "That’s the Abu Bakkar Way!",
    lines: ["Galti maan lena kamzori nahi.", "Sach bol kar apni galti sudhaarna asal bahaduri hai."],
  },
  {
    situation: "Your child’s friend is being treated unfairly.", ask: "What should they do?", right: 2,
    options: [
      { text: "Ignore the situation", why: "Looking away leaves a friend alone when they need support." },
      { text: "Join the others", why: "Joining in hurts someone and teaches a child to follow the crowd." },
      { text: "Offer support and seek help when needed" },
    ],
    title: "That’s the Abu Bakkar Way!",
    lines: ["Kamzor ka saath dena himmat hai.", "Zarurat ho to kisi bade se madad lena samajhdari hai."],
  },
];
const LETTERS = ["A", "B", "C"];
const SIGNATURE = "Don’t React. Respond Like Abu Bakkar.";

/** "Agar Abu Bakkar Hota To Kya Karta?": one situation at a time. No signup. A wrong answer is explained kindly and can be retried. */
export default function ScenarioQuiz() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const s = SCENARIOS[i];
  const correct = picked === s.right;

  function pick(n: number) {
    if (picked === s.right) return;
    setPicked(n);
    try { adEvent("QuizAnswer", { scenario: i + 1, correct: n === s.right }); } catch {}
  }
  function next() {
    setPicked(null);
    if (i + 1 >= SCENARIOS.length) { setFinished(true); try { adEvent("QuizCompleted", {}); } catch {} }
    else setI(i + 1);
    setTimeout(() => top.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 30);
  }
  function restart() { setI(0); setPicked(null); setFinished(false); }

  function shareLink() { return `${location.origin}/?rf=${myReferralCode()}&utm_source=share&utm_medium=play&utm_content=play#play`; }
  function shareText(body: string) { return `${body}\n\n${SIGNATURE}\n${shareLink()}`; }
  function sendWhatsApp(body: string) {
    track("share_whatsapp", { section: "play", rf: myReferralCode() }); adEvent("Share", { method: "whatsapp", section: "play" });
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText(body))}`, "_blank", "noopener");
  }
  async function shareParent() {
    const body = "Agar Abu Bakkar Hota To Kya Karta? A 1 minute game for parents and children. Try it.";
    const touch = window.matchMedia?.("(pointer: coarse)").matches;
    if (touch && typeof navigator.share === "function") {
      try { await navigator.share({ title: "Agar Abu Bakkar Hota To Kya Karta?", text: body, url: shareLink() }); track("share_native", { section: "play", rf: myReferralCode() }); adEvent("Share", { method: "native", section: "play" }); } catch {}
      return;
    }
    sendWhatsApp(body);
  }

  return (
    <div ref={top} className="mx-auto max-w-2xl">
      {!finished ? (
        <div className="rounded-3xl bg-white p-5 text-[#14241c] shadow-2xl md:p-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#0b5a3e]">Situation {i + 1} of {SCENARIOS.length}</p>
            <div className="flex gap-1.5" aria-hidden>{SCENARIOS.map((_, n) => <span key={n} className={`h-2 w-8 rounded-full ${n < i || (n === i && correct) ? "bg-emerald" : n === i ? "bg-gold" : "bg-slate-200"}`} />)}</div>
          </div>
          <h3 className="mt-4 font-serif text-2xl font-bold leading-snug text-navy md:text-3xl">{s.situation}</h3>
          <p className="mt-1 text-lg font-semibold text-[#0b5a3e]">{s.ask}</p>

          <div className="mt-5 grid gap-3">
            {s.options.map((o, n) => {
              const chosen = picked === n;
              const state = picked === null ? "idle" : n === s.right && correct ? "right" : chosen ? "wrong" : "idle";
              return (
                <button key={o.text} type="button" onClick={() => pick(n)} disabled={correct}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left text-base font-semibold transition active:scale-[0.99] md:text-lg ${
                    state === "right" ? "border-emerald bg-emerald-50 text-[#0a3d2c]" : state === "wrong" ? "border-red-300 bg-red-50 text-red-900" : "border-slate-200 bg-white text-navy hover:border-[#0b5a3e] hover:bg-slate-50"} disabled:cursor-default`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold ${state === "right" ? "bg-emerald text-white" : state === "wrong" ? "bg-red-500 text-white" : "bg-slate-100 text-[#0b5a3e]"}`}>{LETTERS[n]}</span>
                  <span>{o.text}</span>
                </button>
              );
            })}
          </div>

          <div aria-live="polite">
            {picked !== null && !correct && (
              <div className="pop mt-5 rounded-2xl bg-amber-50 p-4 text-[#5b3d00]">
                <p className="font-bold">Not quite. Think about it once more.</p>
                <p className="mt-1 text-sm">{s.options[picked].why}</p>
                <button type="button" onClick={() => setPicked(null)} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#0b5a3e] underline"><RotateCcw size={15} />Try again</button>
              </div>
            )}
            {correct && (
              <div className="pop mt-5 rounded-2xl bg-gradient-to-br from-[#0b5a3e] to-[#052a1f] p-5 text-white">
                <p className="font-serif text-2xl font-extrabold text-gold">{s.title}</p>
                {s.lines.map((l) => <p key={l} className="mt-2 text-base leading-snug md:text-lg">{l}</p>)}
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={next} className="btn-gold !py-3">{i + 1 >= SCENARIOS.length ? "See Your Result" : "Next Situation"}<ArrowRight size={18} className="ml-2" /></button>
                  <button type="button" onClick={() => sendWhatsApp(`${s.situation} ${s.ask}\nThe Abu Bakkar Way: ${s.options[s.right].text}.\n${s.lines.join(" ")}`)}
                    className="btn border-2 border-white/60 !py-3 text-white hover:bg-white/10"><Send size={16} className="mr-2" />Share this</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="pop rounded-3xl bg-white p-6 text-center text-[#14241c] shadow-2xl md:p-10">
          <p className="font-serif text-3xl font-extrabold text-[#0b5a3e] md:text-4xl">Mashallah! You think like Abu Bakkar.</p>
          <p className="mx-auto mt-3 max-w-md text-lg text-slate-700">Now imagine your child making these choices every day. This is what we practise in class.</p>
          <p className="mt-5 text-sm font-extrabold uppercase tracking-[0.25em] text-gold">{SIGNATURE}</p>
          <div className="mt-7 flex flex-col gap-3">
            <EnrollLink href="/enroll" className="btn-gold !py-4 text-lg">Teach Your Child These Life Skills</EnrollLink>
            <button type="button" onClick={shareParent} className="btn border-2 border-[#0b5a3e] !py-3.5 text-lg text-[#0b5a3e] hover:bg-emerald-50"><Send size={18} className="mr-2" />Share This With Another Parent</button>
            <button type="button" onClick={restart} className="mx-auto inline-flex items-center gap-2 text-sm font-semibold text-slate-500 underline"><RotateCcw size={14} />Play again</button>
          </div>
        </div>
      )}

      {/* Always available */}
      {!finished && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={shareParent} className="btn border-2 border-white/60 !py-3 text-white hover:bg-white/10"><Send size={16} className="mr-2" />Share This With Another Parent</button>
          <EnrollLink href="/enroll" className="btn-gold !py-3">Teach Your Child These Life Skills</EnrollLink>
        </div>
      )}
    </div>
  );
}
