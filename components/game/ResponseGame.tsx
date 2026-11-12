"use client";
import "./game.css";
import Link from "next/link";
import { Lilita_One, Nunito } from "next/font/google";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adEvent } from "../Analytics";
import { myReferralCode, track } from "../Tracker";
import Scene from "./Scene";
import { LEVELS, MAX_XP, POINTS, SABR_DELTA, comboBonus, rankFor, type Tier } from "./gameData";
import { buzz, isMuted, setMuted, sfx } from "./sfx";

const display = Lilita_One({ subsets: ["latin"], weight: "400", display: "swap" });
const body = Nunito({ subsets: ["latin"], weight: ["600", "700", "800", "900"], display: "swap" });

type Screen = "title" | "play" | "result";
type Phase = "intro" | "ask" | "result";

const TIER_LABEL: Record<Tier, [string, string]> = {
  best: ["ABU BAKKAR WAY!", "Yeh hai asal respond."],
  okay: ["THEEK HAI", "Baat tal gayi magar masla hal nahi hua."],
  react: ["JALDI MEIN REACT KIYA", "Aisa sab ke saath hota hai. Ek behtar tareeqa bhi hai."],
};
const LETTERS = ["A", "B", "C"];

/** Browser-side events for GTM (the campaign brief's aba_game_* names) plus the site's own funnel counter. */
function gtm(name: string) { try { if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name }); } catch { /* ignore */ } }

export default function ResponseGame({ price, schedule }: { price: string; schedule: string }) {
  const [screen, setScreen] = useState<Screen>("title");
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState(0);
  const [xp, setXp] = useState(0);
  const [sabr, setSabr] = useState(50);
  const [combo, setCombo] = useState(0);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [gain, setGain] = useState<{ n: number; k: number } | null>(null);
  const [sound, setSound] = useState(true);
  const [beat, setBeat] = useState<number | null>(null);
  const [shown, setShown] = useState(0);        // animated XP on the result screen
  const [note, setNote] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const started = useRef(false);

  const lv = LEVELS[idx];
  const choice = picked !== null ? lv.responses[picked] : null;
  const tier = choice?.tier ?? null;
  const reduce = useRef(false);

  // Remember the sound choice and read a friend's score from a shared link (?beat=450).
  useEffect(() => {
    reduce.current = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    try { const s = localStorage.getItem("aba_game_sound"); if (s === "off") { setSound(false); setMuted(true); } } catch { /* ignore */ }
    const b = Number(new URLSearchParams(location.search).get("beat"));
    if (Number.isInteger(b) && b > 0 && b <= MAX_XP) setBeat(b);
  }, []);
  const toggleSound = () => {
    const next = !sound; setSound(next); setMuted(!next);
    try { localStorage.setItem("aba_game_sound", next ? "on" : "off"); } catch { /* ignore */ }
    if (next) sfx.tap();
  };

  const toStage = () => stage.current?.scrollIntoView({ behavior: reduce.current ? "auto" : "smooth", block: "start" });

  function start() {
    sfx.level(); toStage();
    setIdx(0); setXp(0); setSabr(50); setCombo(0); setTiers([]); setPicked(null); setGain(null); setNote("");
    setPhase("intro"); setScreen("play");
    if (!started.current) { started.current = true; }
    track("game_start"); adEvent("GameStart"); gtm("aba_game_start");
  }

  // Level banner shows for a moment, then the situation is spoken letter by letter.
  useEffect(() => {
    if (screen !== "play" || phase !== "intro") return;
    const t = setTimeout(() => { setTyped(0); setPhase("ask"); }, reduce.current ? 500 : 1500);
    return () => clearTimeout(t);
  }, [screen, phase, idx]);

  useEffect(() => {
    if (screen !== "play" || phase !== "ask") return;
    if (reduce.current) { setTyped(lv.line.length); return; }
    let n = 0;
    const t = setInterval(() => { n++; setTyped(n); if (n % 3 === 0) sfx.type(); if (n >= lv.line.length) clearInterval(t); }, 24);
    return () => clearInterval(t);
  }, [screen, phase, idx, lv.line.length]);

  const lineDone = typed >= lv.line.length;
  const skipTyping = () => { if (phase === "ask" && !lineDone) setTyped(lv.line.length); };

  function choose(i: number) {
    if (phase !== "ask" || picked !== null || !lineDone) return;
    const r = lv.responses[i];
    const nextCombo = r.tier === "best" ? combo + 1 : 0;
    const points = POINTS[r.tier] + (r.tier === "best" ? comboBonus(nextCombo) : 0);
    setPicked(i); setPhase("result"); setCombo(nextCombo);
    setXp((v) => v + points); setSabr((v) => Math.max(0, Math.min(100, v + SABR_DELTA[r.tier])));
    setTiers((t) => [...t, r.tier]); setGain({ n: points, k: Date.now() });
    if (r.tier === "best") { sfx.best(); buzz(30); } else if (r.tier === "okay") { sfx.okay(); } else { sfx.react(); buzz([60, 40, 90]); }
    setTimeout(() => nextRef.current?.focus({ preventScroll: true }), 450);
  }

  function next() {
    sfx.tap();
    if (idx + 1 >= LEVELS.length) { finish(); return; }
    setIdx(idx + 1); setPicked(null); setGain(null); setPhase("intro"); sfx.level();
  }

  const finalXp = xp;
  function finish() {
    setScreen("result"); setShown(0); setNote("");
    const rk = rankFor(finalXp); (rk.key === "champion" ? sfx.win : sfx.done)();
    track("game_complete"); adEvent("GameComplete", { rank: rk.key }); gtm("aba_game_complete");
    toStage();
  }

  // Count the final score up (instant if the visitor prefers less motion).
  useEffect(() => {
    if (screen !== "result") return;
    if (reduce.current) { setShown(xp); return; }
    let raf = 0; const t0 = performance.now(), dur = 1100;
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / dur); setShown(Math.round(xp * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [screen, xp]);

  function onKey(e: React.KeyboardEvent) {
    if (screen !== "play" || phase !== "ask") return;
    const k = e.key.toLowerCase();
    const n = k === "1" || k === "a" ? 0 : k === "2" || k === "b" ? 1 : k === "3" || k === "c" ? 2 : -1;
    if (n >= 0) { e.preventDefault(); choose(n); }
  }

  // Sparkle burst vectors are fixed per answer so they do not jump around on re-render.
  const burst = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + (i % 2 ? 0.2 : 0), d = 70 + ((i * 37) % 60);
    return { dx: Math.round(Math.cos(a) * d), dy: Math.round(Math.sin(a) * d - 30), delay: (i % 5) * 30 };
  }), []);

  // ---------------------------------------------------------------- sharing
  const rank = rankFor(xp);
  const weakest = useMemo(() => {
    const order: Tier[] = ["react", "okay", "best"];
    let w = 0; tiers.forEach((t, i) => { if (order.indexOf(t) < order.indexOf(tiers[w])) w = i; });
    return LEVELS[w] ?? LEVELS[0];
  }, [tiers]);

  const link = useCallback(() => `${location.origin}/?rf=${myReferralCode()}&utm_source=share&utm_medium=play&utm_content=play&beat=${xp}#play`, [xp]);
  const shareText = () => `Maine Abu Bakkar Response Challenge mein ${xp} XP banaye! Rank: ${rank.title}.\nKya aap beat kar sakte hain?\nDon't React. Respond Like Abu Bakkar.\n${link()}`;
  const afterShare = (m: "whatsapp" | "native" | "copy") => {
    track(m === "whatsapp" ? "share_whatsapp" : m === "native" ? "share_native" : "share_copy", { section: "play", rf: myReferralCode() });
    adEvent("Share", { method: m, section: "play" }); gtm("aba_game_share");
  };
  const toWhatsApp = () => { afterShare("whatsapp"); window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, "_blank", "noopener"); };

  async function makeCard(): Promise<Blob | null> {
    try {
      const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
      const g = c.getContext("2d"); if (!g) return null;
      const font = display.style.fontFamily;
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#04201a"); sky.addColorStop(1, "#0b5a3e");
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(255,230,150,.9)"; for (let i = 0; i < 46; i++) { g.beginPath(); g.arc((i * 193) % W, (i * 127) % 640, i % 3 === 0 ? 3 : 1.8, 0, 7); g.fill(); }
      g.strokeStyle = "#f6c244"; g.lineWidth = 12; g.strokeRect(30, 30, W - 60, H - 60);
      const img = await new Promise<HTMLImageElement | null>((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = "/play/logo-mark.png"; });
      g.fillStyle = "#fff6df"; g.beginPath(); g.roundRect(W / 2 - 80, 80, 160, 140, 28); g.fill();
      if (img) g.drawImage(img, W / 2 - 66, 90, 132, 120);
      g.textAlign = "center"; g.fillStyle = "#ffe08a"; g.font = `64px ${font}`; g.fillText("ABU BAKKAR RESPONSE CHALLENGE", W / 2, 320);
      g.fillStyle = "#fff"; g.font = `110px ${font}`; g.fillText(rank.title.toUpperCase(), W / 2, 500);
      g.fillStyle = "#f6c244"; g.font = `300px ${font}`; g.fillText(String(xp), W / 2, 790);
      g.fillStyle = "#fff"; g.font = `70px ${font}`; g.fillText("XP", W / 2, 880);
      LEVELS.forEach((l, i) => {
        const t = tiers[i], x = 140 + i * 200, y = 1000;
        g.fillStyle = t === "best" ? "#f6c244" : t === "okay" ? "#c9d4cf" : "#3b5a4e"; g.beginPath(); g.arc(x, y, 62, 0, 7); g.fill();
        g.lineWidth = 8; g.strokeStyle = "#052a1f"; g.stroke();
        g.fillStyle = "#052a1f"; g.font = `50px ${font}`; g.fillText(String(i + 1), x, y + 18);
        g.fillStyle = "#fff"; g.font = `34px ${font}`; g.fillText(l.quality.toUpperCase(), x, y + 112);
      });
      g.fillStyle = "#ffe08a"; g.font = `62px ${font}`; g.fillText("Kya aap beat kar sakte hain?", W / 2, 1210);
      g.fillStyle = "#fff"; g.font = `46px ${font}`; g.fillText("abubakkaracademy.com/#play", W / 2, 1275);
      return await new Promise((res) => c.toBlob((b) => res(b), "image/png"));
    } catch { return null; }
  }

  async function shareNative() {
    const touch = window.matchMedia?.("(pointer: coarse)").matches;
    if (touch && typeof navigator.share === "function") {
      try {
        const blob = await makeCard();
        const file = blob ? new File([blob], "abu-bakkar-challenge.png", { type: "image/png" }) : null;
        const data: ShareData = file && navigator.canShare?.({ files: [file] }) ? { files: [file], text: shareText() } : { text: shareText() };
        await navigator.share(data); afterShare("native"); return;
      } catch { return; }
    }
    toWhatsApp();
  }
  async function saveCard() {
    const blob = await makeCard(); if (!blob) return;
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "abu-bakkar-response-challenge.png"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); gtm("aba_game_result_download"); setNote("Card saved. Ab isay Story ya status mein lagayein!");
  }
  async function copyLink() { try { await navigator.clipboard.writeText(shareText()); afterShare("copy"); setNote("Link copy ho gaya. Kisi ko bhi bhejein!"); } catch { toWhatsApp(); } }

  const enrollClick = () => { track("enroll_click"); adEvent("Lead"); gtm("aba_game_enroll_click"); };

  // ---------------------------------------------------------------- screens
  const root = `rg ${display.className} ${body.className}`;
  const fx = tier === "react" ? "rg-hit" : tier === "best" ? "rg-win" : "";

  return (
    <div ref={stage} className={root} style={{ ["--rg-display" as string]: display.style.fontFamily, ["--rg-body" as string]: body.style.fontFamily }} tabIndex={-1} onKeyDown={onKey} aria-label="Abu Bakkar Response Challenge game">
      <div className={`rg-stage ${fx}`} key={screen === "play" ? `p${idx}${picked ?? "x"}` : screen}>
        {screen === "title" && <Title beat={beat} onStart={start} sound={sound} onSound={toggleSound} />}

        {screen === "play" && (
          <div className="rg-play">
            <div className="rg-hud">
              <div className="rg-chips" aria-label={`Level ${idx + 1} of ${LEVELS.length}`}>
                {LEVELS.map((l, i) => <span key={l.id} className={`rg-chip ${i < tiers.length ? "done" : i === idx ? "now" : ""}`}>{i + 1}</span>)}
              </div>
              <div className="rg-meter" aria-label={`Sabr ${sabr} percent`}>
                <span className="rg-meter-label">SABR</span>
                <div className="rg-meter-track"><div className={`rg-meter-fill ${sabr < 30 ? "low" : ""}`} style={{ width: `${sabr}%` }} /></div>
              </div>
              <div className="rg-xp"><span>XP</span><b>{xp}</b></div>
              <button type="button" className="rg-mute" onClick={toggleSound} aria-label={sound ? "Sound off" : "Sound on"}>{sound ? "♪" : "×"}</button>
            </div>

            <div className="rg-view">
              <Scene scene={lv.scene} you={choice?.you ?? "neutral"} other={choice?.other ?? lv.otherStart} other2={choice?.other2 ?? lv.other2Start} tier={tier} />
              {tier === "best" && <div className="rg-burst" aria-hidden>{burst.map((b, i) => <i key={i} style={{ ["--dx" as string]: `${b.dx}px`, ["--dy" as string]: `${b.dy}px`, animationDelay: `${b.delay}ms` }} />)}</div>}
              {gain && <div key={gain.k} className={`rg-gain ${gain.n === 0 ? "zero" : ""}`} aria-hidden>{gain.n > 0 ? `+${gain.n}` : "+0"}</div>}
              {tier === "best" && combo >= 2 && <div className="rg-combo" aria-hidden>COMBO x{combo}</div>}
              {phase === "intro" && (
                <div className="rg-banner" role="status">
                  <small>LEVEL {lv.id}</small><strong>{lv.chapter}</strong><em>{lv.quality.toUpperCase()}</em>
                </div>
              )}
            </div>

            <div className="rg-panel">
              {phase === "ask" && (
                <div className="rg-bubble" onClick={skipTyping}>
                  <span className="rg-who">{lv.speaker}</span>
                  <p aria-live="off">{`“${lv.line.slice(0, typed)}`}<span className="rg-caret">{lineDone ? "”" : ""}</span></p>
                </div>
              )}

              {phase === "ask" && lineDone && (
                <div className="rg-ask">
                  <p className="rg-q">{lv.ask}</p>
                  <div className="rg-cards">
                    {lv.responses.map((r, i) => (
                      <button key={r.title} type="button" className="rg-card" style={{ animationDelay: `${i * 90}ms` }} onClick={() => choose(i)}>
                        <span className="rg-letter">{LETTERS[i]}</span>
                        <span className="rg-card-t"><b>{r.title}</b><small>{r.detail}</small></span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {phase === "result" && choice && (
                <div className={`rg-out t-${choice.tier}`} role="status" aria-live="polite">
                  <div className="rg-verdict"><strong>{TIER_LABEL[choice.tier][0]}</strong><span>{choice.title}</span></div>
                  <p className="rg-outcome">{choice.outcome}</p>
                  {choice.tier !== "best" && <p className="rg-better"><b>Behtar tareeqa:</b> {lv.responses.find((r) => r.tier === "best")!.title}</p>}
                  <div className="rg-lesson"><b>Abu Bakkar ka tareeqa</b><p>{lv.lesson}</p><p className="rg-say">Aisa keh kar dekhein: “{lv.say}”</p></div>
                  <button ref={nextRef} type="button" className="rg-btn rg-next" onClick={next}>{idx + 1 >= LEVELS.length ? "MERA RESULT" : "AGLA LEVEL"} <span aria-hidden>▶</span></button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === "result" && (
          <div className="rg-result">
            <div className="rg-res-scroll">
              <div className="rg-res-top">
                <small>CHALLENGE COMPLETE</small>
                <h3>{rank.title}</h3>
                <p>{rank.sub}</p>
              </div>
              <div className="rg-score"><b>{shown}</b><span>/ {MAX_XP} XP</span></div>
              {beat !== null && <p className={`rg-vs ${xp > beat ? "win" : ""}`}>{xp > beat ? `Aap ne dost ke ${beat} XP beat kar diye!` : xp === beat ? `Barabar! Dost ke ${beat} XP.` : `Dost ke ${beat} XP the. Phir koshish karein!`}</p>}
              <ol className="rg-medals" aria-label="Your badges">
                {LEVELS.map((l, i) => <li key={l.id} className={`m-${tiers[i] ?? "react"}`}><span>{i + 1}</span><small>{l.quality}</small></li>)}
              </ol>
              <div className="rg-actions">
                <button type="button" className="rg-btn" onClick={shareNative}>CHALLENGE A FRIEND ↗</button>
                <div className="rg-row"><button type="button" className="rg-btn rg-sub" onClick={toWhatsApp}>WhatsApp</button><button type="button" className="rg-btn rg-sub" onClick={saveCard}>Save Card</button><button type="button" className="rg-btn rg-sub" onClick={copyLink}>Copy</button></div>
                <p className="rg-note" role="status">{note}</p>
              </div>
              <div className="rg-home">
                <b>Aaj ghar par yeh baat karein</b>
                <p>{weakest.dinner}</p>
              </div>
              <button type="button" className="rg-again" onClick={start}>↻ Play Again</button>
            </div>
            {/* Always visible: the enroll button never scrolls out of sight */}
            <div className="rg-res-foot">
              <p><b>Mere bachay ko bhi yeh seekhna chahiye!</b><br />Live Character Grooming · Ages 5 to 15 · From {price}/month</p>
              <Link href="/enroll" onClick={enrollClick} className="rg-btn rg-green">BACHAY KO ENROLL KAREIN →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Title({ beat, onStart, sound, onSound }: { beat: number | null; onStart: () => void; sound: boolean; onSound: () => void }) {
  const stars = useMemo(() => Array.from({ length: 34 }, (_, i) => ({ x: (i * 53) % 100, y: (i * 29) % 58, d: (i % 7) * 0.4, s: i % 4 === 0 ? 3 : 2 })), []);
  return (
    <div className="rg-title">
      <div className="rg-sky" aria-hidden>
        {stars.map((s, i) => <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />)}
        <svg className="rg-moon" viewBox="0 0 80 80"><path d="M52 8 a32 32 0 1 0 20 52 a26 26 0 1 1 -20 -52z" fill="#ffe08a" /></svg>
        <svg className="rg-skyline" viewBox="0 0 400 130" preserveAspectRatio="xMidYMax slice">
          <g fill="#052f23"><rect x="0" y="96" width="400" height="34" />
            <path d="M40 96 V70 h26 V96Z M150 96 V60 Q173 22 196 60 V96Z M214 96 V74 h30 V96Z M300 96 V56 Q326 18 352 56 V96Z M366 96 V80 h34 V96Z" />
            <rect x="120" y="36" width="8" height="60" /><path d="M118 36 L124 18 L130 36Z" /><rect x="272" y="44" width="8" height="52" /><path d="M270 44 L276 28 L282 44Z" />
            <circle cx="173" cy="26" r="4" /><rect x="172" y="12" width="2" height="12" /><circle cx="326" cy="22" r="4" /><rect x="325" y="8" width="2" height="12" /></g>
          <g fill="#f6c244" opacity=".8"><rect x="166" y="70" width="5" height="9" rx="2" /><rect x="176" y="70" width="5" height="9" rx="2" /><rect x="318" y="66" width="5" height="9" rx="2" /><rect x="329" y="66" width="5" height="9" rx="2" /><rect x="48" y="78" width="5" height="7" /><rect x="222" y="82" width="5" height="7" /></g>
        </svg>
      </div>
      <button type="button" className="rg-mute rg-mute-title" onClick={onSound} aria-label={sound ? "Sound off" : "Sound on"}>{sound ? "♪" : "×"}</button>
      <div className="rg-title-in">
        <div className="rg-plate"><img src="/play/logo-mark.png" alt="Abu Bakkar Academy" width="64" height="56" /></div>
        <small className="rg-kicker">ABU BAKKAR ACADEMY PRESENTS</small>
        <h3 className="rg-logo"><span>AGAR ABU BAKKAR</span><span>HOTA TO</span><em>KYA KARTA?</em></h3>
        <p className="rg-tag">DON’T REACT. RESPOND.</p>
        {beat !== null && <p className="rg-beat">Ek dost ne <b>{beat} XP</b> banaye hain. Kya aap beat kar sakte hain?</p>}
        <button type="button" className="rg-btn rg-start" onClick={onStart}>▶ START GAME</button>
        <p className="rg-meta">5 LEVELS · 2 MINUTES · FREE · NO SIGNUP</p>
      </div>
    </div>
  );
}
