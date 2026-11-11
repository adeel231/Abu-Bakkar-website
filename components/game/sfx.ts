// Tiny synthesized sound effects (no audio files to download). Every call is best effort: if audio is blocked nothing happens.
let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) { muted = m; }
export function isMuted() { return muted; }

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}

type Note = { f: number; t: number; d: number; type?: OscillatorType; v?: number; to?: number };
function play(notes: Note[]) {
  if (muted) return;
  const c = ac(); if (!c) return;
  const now = c.currentTime;
  for (const n of notes) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = n.type ?? "square";
    o.frequency.setValueAtTime(n.f, now + n.t);
    if (n.to) o.frequency.exponentialRampToValueAtTime(n.to, now + n.t + n.d);
    const v = n.v ?? 0.06;
    g.gain.setValueAtTime(0.0001, now + n.t);
    g.gain.exponentialRampToValueAtTime(v, now + n.t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
    o.connect(g).connect(c.destination);
    o.start(now + n.t); o.stop(now + n.t + n.d + 0.02);
  }
}

const N = { C5: 523, E5: 659, G5: 784, C6: 1047, A4: 440, D5: 587, F5: 698 };

export const sfx = {
  tap: () => play([{ f: 620, t: 0, d: 0.06, v: 0.04 }]),
  type: () => play([{ f: 900 + Math.random() * 120, t: 0, d: 0.025, v: 0.012, type: "triangle" }]),
  pick: () => play([{ f: 330, t: 0, d: 0.08, v: 0.05 }, { f: 495, t: 0.06, d: 0.1, v: 0.05 }]),
  level: () => play([{ f: 220, t: 0, d: 0.5, to: 880, type: "sawtooth", v: 0.035 }, { f: N.C5, t: 0.42, d: 0.18, v: 0.05 }]),
  best: () => play([N.C5, N.E5, N.G5, N.C6].map((f, i) => ({ f, t: i * 0.07, d: 0.16, type: "triangle" as const, v: 0.09 }))),
  okay: () => play([{ f: N.A4, t: 0, d: 0.16, type: "triangle", v: 0.08 }, { f: N.D5, t: 0.1, d: 0.2, type: "triangle", v: 0.07 }]),
  react: () => play([{ f: 200, t: 0, d: 0.34, to: 70, type: "sawtooth", v: 0.07 }, { f: 90, t: 0.04, d: 0.3, to: 55, type: "square", v: 0.05 }]),
  win: () => play([N.C5, N.E5, N.G5, N.C6, N.G5, N.C6].map((f, i) => ({ f, t: i * 0.11, d: i === 5 ? 0.6 : 0.2, type: "triangle" as const, v: 0.1 }))),
  done: () => play([N.G5, N.F5, N.E5, N.D5].map((f, i) => ({ f, t: i * 0.12, d: 0.22, type: "triangle" as const, v: 0.08 }))),
};

export function buzz(ms: number | number[]) {
  try { if (!muted && "vibrate" in navigator) navigator.vibrate(ms); } catch { /* not supported */ }
}
