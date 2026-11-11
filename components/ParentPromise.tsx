"use client";
import { Heart, HeartHandshake, Facebook, Send, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { adEvent } from "./Analytics";
import { myReferralCode, track } from "./Tracker";

/** Students and families the academy has already taught (confirmed by the academy). The counter starts here and
 *  goes up by one for every new "I Support This Promise" press, which is the real count stored in the database. */
const PROMISE_BASE = 1000;

export default function ParentPromise({ text, count: initialCount = 0 }: { text: string; count?: number }) {
  const [supported, setSupported] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [justJoined, setJustJoined] = useState(false);
  const [url, setUrl] = useState("https://www.abubakkaracademy.com");
  // The browser remembers if this parent already promised. Until that has been read, hide the texts that depend on it,
  // so a returning parent never sees the "join them" wording flash before "You have made this promise".
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setSupported(localStorage.getItem("aba_promise") === "1"); } catch {}
    setReady(true);
    setUrl(`${location.origin}/?rf=${myReferralCode()}&utm_source=share&utm_medium=section&utm_content=promise#promise`);
  }, []);

  // Message + link only. Never include any enrollment or child information.
  const msg = `“${text}”\n\nAbu Bakkar Academy — Sirf Taleem Nahi, Tarbiyat Bhi.\n${url}`;

  function support() {
    if (supported) return;
    setSupported(true);
    setCount((n) => n + 1);
    setJustJoined(true);
    try { localStorage.setItem("aba_promise", "1"); } catch {}
    track("promise_support");
    adEvent("PromiseSupport");
  }
  function wa() {
    track("share_whatsapp", { section: "promise", rf: myReferralCode() }); adEvent("Share", { method: "whatsapp", section: "promise" });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }
  function fb() {
    track("share_facebook", { section: "promise", rf: myReferralCode() }); adEvent("Share", { method: "facebook", section: "promise" });
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  return (
    <section id="promise" className="relative isolate overflow-hidden bg-[#fdf2e7] text-[#0b3d2c]">
      {/* Photo: right side on desktop, strip under the content on mobile. Its left edge fades into the cream. */}
      <div role="img" aria-label="A mother with her arm around her son, looking toward a mosque at sunset"
        className="promise-photo h-64 w-full bg-cover bg-[position:70%_30%] md:absolute md:inset-y-0 md:right-0 md:-z-10 md:h-auto md:w-[52%] md:bg-[position:right_center]"
        style={{ backgroundImage: "url(/parent-promise.png)" }} />

      <div className="mx-auto grid max-w-6xl px-5 pb-8 pt-16 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <div className="text-center">
          <HeartHandshake size={56} strokeWidth={1.75} className="mx-auto text-gold" />
          <h2 className="mt-3 font-serif text-4xl font-bold text-[#0b3d2c] md:text-5xl">The Parent Promise</h2>
          <blockquote className="mx-auto mt-8 max-w-lg font-serif text-3xl font-bold leading-snug text-[#0b3d2c] md:text-4xl">
            “{text}”
          </blockquote>
          <div className="mx-auto mt-6 h-0.5 w-56 bg-gradient-to-r from-transparent via-gold to-transparent" />

          {/* Counter: past students and families (PROMISE_BASE) plus every new promise made on this site. */}
          <div className="mx-auto mt-8 w-full max-w-md rounded-2xl border border-gold/60 bg-white/70 px-6 py-5 shadow-sm" aria-live="polite">
            <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#0b5a3e]">
              <Users size={18} /> Our academy family
            </p>
            <p key={count} className={`mt-1 font-serif text-5xl font-extrabold text-[#0b3d2c] ${justJoined ? "animate-[promise-pop_0.6s_ease-out]" : ""}`}>
              {(PROMISE_BASE + count).toLocaleString("en-US")}+
            </p>
            <p className={`mt-2 min-h-[2.5rem] text-sm text-[#2f3b35] transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>
              {justJoined ? "JazakAllah! You are one of them now." : supported ? "You have made this promise. JazakAllah!" : "Parents and students who have been part of Abu Bakkar Academy. Make your promise below and join them."}
            </p>
          </div>

          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
            <button onClick={support} className="btn w-full bg-[#0b5a3e] text-lg text-white shadow-lg hover:brightness-110">
              <Heart size={20} className="mr-2" fill="currentColor" />
              <span className={`transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}>{supported ? "Thank you for your promise" : "I Support This Promise"}</span>
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={wa} className="btn bg-[#1f9a4d] !px-3 text-white shadow-lg hover:brightness-110"><Send size={18} className="mr-2 shrink-0" />Share on WhatsApp</button>
              <button onClick={fb} className="btn bg-[#1b6fe0] !px-3 text-white shadow-lg hover:brightness-110"><Facebook size={18} className="mr-2 shrink-0" />Share on Facebook</button>
            </div>
          </div>
        </div>
        <div className="hidden md:block" />
      </div>
    </section>
  );
}
