import type { Mood, SceneId, Tier } from "./gameData";

// Flat vector scenes in a chunky outlined style (no images to download). viewBox 400 x 300, ground line near y = 236.
const INK = "#052a1f";
const OUT = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" } as const;

type KidProps = {
  x: number; y?: number; s?: number; flip?: boolean; mood: Mood;
  skin?: string; shirt: string; pants?: string; hair?: string;
  kind?: "kid" | "adult" | "girl"; scarf?: string; badge?: boolean; steam?: boolean; sparkle?: boolean; sit?: boolean;
};

function Face({ mood }: { mood: Mood }) {
  const eye = (cx: number, r = 2.8) => <circle cx={cx} cy={-111} r={r} fill={INK} />;
  const arcEye = (cx: number) => <path d={`M${cx - 5} -110 Q${cx} -116 ${cx + 5} -110`} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />;
  const brow = (x1: number, y1: number, x2: number, y2: number) => <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={INK} strokeWidth="3" strokeLinecap="round" />;
  switch (mood) {
    case "angry": return (<g>
      <circle cx="-15" cy="-101" r="5" fill="#ff7a5c" opacity=".55" /><circle cx="15" cy="-101" r="5" fill="#ff7a5c" opacity=".55" />
      {eye(-9)}{eye(9)}{brow(-16, -122, -3, -117)}{brow(16, -122, 3, -117)}
      <path d="M-8 -93 Q0 -101 8 -93" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" /></g>);
    case "sad": return (<g>
      {eye(-9)}{eye(9)}{brow(-16, -118, -4, -122)}{brow(16, -118, 4, -122)}
      <path d="M-7 -93 Q0 -99 7 -93" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M-12 -106 q-3 6 0 9 q3 -3 0 -9z" fill="#7cc4ff" stroke={INK} strokeWidth="1.5" /></g>);
    case "calm": return (<g>
      <circle cx="-15" cy="-101" r="4.5" fill="#ff9a7a" opacity=".45" /><circle cx="15" cy="-101" r="4.5" fill="#ff9a7a" opacity=".45" />
      {arcEye(-9)}{arcEye(9)}<path d="M-7 -98 Q0 -91 7 -98" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" /></g>);
    case "smug": return (<g>
      {eye(-9)}{eye(9)}{brow(-16, -121, -3, -120)}{brow(3, -123, 16, -118)}
      <path d="M-8 -95 Q2 -92 9 -99" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" /></g>);
    case "laugh": return (<g>
      {arcEye(-9)}{arcEye(9)}
      <path d="M-9 -99 Q0 -84 9 -99 Z" fill="#7a1c1c" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" /><path d="M-5 -93 Q0 -89 5 -93 Q0 -97 -5 -93z" fill="#ff8a80" /></g>);
    case "shock": return (<g>
      <circle cx="-9" cy="-111" r="6" fill="#fff" stroke={INK} strokeWidth="2" /><circle cx="9" cy="-111" r="6" fill="#fff" stroke={INK} strokeWidth="2" />
      <circle cx="-9" cy="-111" r="2.4" fill={INK} /><circle cx="9" cy="-111" r="2.4" fill={INK} />
      {brow(-16, -124, -4, -125)}{brow(16, -124, 4, -125)}<ellipse cx="0" cy="-96" rx="4" ry="5" fill="#7a1c1c" stroke={INK} strokeWidth="2.4" /></g>);
    case "happy": return (<g>
      <circle cx="-15" cy="-101" r="4.5" fill="#ff9a7a" opacity=".5" /><circle cx="15" cy="-101" r="4.5" fill="#ff9a7a" opacity=".5" />
      {eye(-9, 3.2)}{eye(9, 3.2)}<circle cx="-8" cy="-112.2" r="1" fill="#fff" /><circle cx="10" cy="-112.2" r="1" fill="#fff" />
      <path d="M-9 -99 Q0 -85 9 -99 Z" fill="#7a1c1c" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" /><path d="M-5 -93 Q0 -89 5 -93 Q0 -97 -5 -93z" fill="#ff8a80" /></g>);
    default: return (<g>{eye(-9)}{eye(9)}<path d="M-6 -96 L6 -96" stroke={INK} strokeWidth="3" strokeLinecap="round" /></g>);
  }
}

function Kid({ x, y = 236, s = 1, flip, mood, skin = "#e9b68f", shirt, pants = "#27408b", hair = "#2a1a12", kind = "kid", scarf = "#8a3d6e", badge, steam, sparkle, sit }: KidProps) {
  const sc = kind === "adult" ? s * 1.22 : s;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -sc : sc} ${sc})`}>
      <ellipse cx="0" cy="2" rx="30" ry="6" fill="#000" opacity=".22" />
      <g className={`rg-bob ${mood === "angry" ? "rg-shake" : ""}`}>
        <g {...OUT}>
          {!sit && <><rect x="-15" y="-40" width="13" height="40" rx="5" fill={kind === "adult" ? "#2d3b55" : pants} /><rect x="2" y="-40" width="13" height="40" rx="5" fill={kind === "adult" ? "#2d3b55" : pants} />
          <ellipse cx="-9" cy="-1" rx="11" ry="5" fill="#fff" /><ellipse cx="9" cy="-1" rx="11" ry="5" fill="#fff" /></>}
          {sit && <><rect x="-18" y="-40" width="36" height="13" rx="5" fill={pants} /><rect x="-18" y="-30" width="13" height="30" rx="5" fill={pants} /><rect x="5" y="-30" width="13" height="30" rx="5" fill={pants} /></>}
          {kind === "adult" && <path d="M-24 -90 Q-27 -50 -22 -30 L22 -30 Q27 -50 24 -90 Z" fill={shirt} />}
          {kind !== "adult" && <rect x="-23" y="-90" width="46" height="56" rx="16" fill={shirt} />}
          {badge && <path d="M0 -76 l3.6 7.4 8 1.1 -5.8 5.6 1.4 8 -7.2 -3.8 -7.2 3.8 1.4 -8 -5.8 -5.6 8 -1.1z" fill="#f6c244" strokeWidth="2" />}
          {/* each hand is drawn inside its arm's group, so it always turns with the arm */}
          <g transform={mood === "angry" ? "rotate(18 -27 -84)" : mood === "laugh" ? "rotate(-25 -27 -84)" : ""}>
            <rect x="-33" y="-84" width="12" height="38" rx="6" fill={shirt} /><circle cx="-27" cy="-44" r="7" fill={skin} />
          </g>
          <g transform={mood === "angry" ? "rotate(-18 27 -84)" : mood === "happy" ? "rotate(28 27 -84)" : ""}>
            <rect x="21" y="-84" width="12" height="38" rx="6" fill={shirt} /><circle cx="27" cy="-44" r="7" fill={skin} />
          </g>
          <rect x="-7" y="-96" width="14" height="12" rx="4" fill={skin} />
          {(kind === "adult" || kind === "girl") && <path d={`M-30 -108 Q-33 -148 0 -149 Q33 -148 30 -108 Q31 -80 ${kind === "adult" ? 22 : 18} -76 L-${kind === "adult" ? 22 : 18} -76 Q-31 -80 -30 -108 Z`} fill={scarf} />}
          <circle cx="0" cy="-110" r={kind === "kid" ? 26 : 23} fill={skin} />
          {kind === "kid" && <path d="M-27 -112 Q-30 -142 0 -142 Q30 -142 27 -112 Q22 -126 6 -128 Q-8 -118 -27 -112 Z" fill={hair} />}
        </g>
        <Face mood={mood} />
        {steam && <g className="rg-steam" fill="#fff" stroke={INK} strokeWidth="2"><circle cx="-18" cy="-146" r="6" /><circle cx="0" cy="-156" r="8" /><circle cx="18" cy="-146" r="6" /></g>}
        {sparkle && <g className="rg-twinkle" fill="#ffd45a" stroke={INK} strokeWidth="1.6" strokeLinejoin="round">
          <path d="M-42 -140 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" /><path d="M42 -150 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4z" /></g>}
      </g>
    </g>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity=".92"><ellipse cx="0" cy="0" rx="26" ry="11" /><ellipse cx="-14" cy="-7" rx="14" ry="10" /><ellipse cx="10" cy="-10" rx="17" ry="12" /></g>;
}
function Tree({ x, y = 236, s = 1, c = "#2f9e5f" }: { x: number; y?: number; s?: number; c?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} {...OUT}><rect x="-7" y="-60" width="14" height="60" rx="4" fill="#8b5a2b" /><circle cx="0" cy="-86" r="34" fill={c} /><circle cx="-24" cy="-68" r="22" fill={c} /><circle cx="24" cy="-68" r="22" fill={c} /></g>;
}

function Yard({ tier }: { tier: Tier | null }) {
  return (<>
    <rect x="-300" y="-300" width="1000" height="1000" fill="url(#sky-day)" />
    <circle cx="330" cy="52" r="26" fill="#ffd45a" /><circle cx="330" cy="52" r="38" fill="#ffd45a" opacity=".25" />
    <g className="rg-drift"><Cloud x={70} y={50} /><Cloud x={210} y={34} s={.7} /></g>
    {/* school */}
    <g {...OUT}>
      <rect x="150" y="104" width="170" height="112" fill="#f6e7c1" /><rect x="150" y="104" width="170" height="14" fill="#0e7c5a" />
      <path d="M210 104 Q235 62 260 104 Z" fill="#f6c244" /><rect x="233" y="54" width="4" height="22" fill={INK} /><path d="M237 54 l16 5 -16 5z" fill="#0e7c5a" strokeWidth="2" />
      <path d="M224 216 L224 170 Q242 148 260 170 L260 216 Z" fill="#7a4b2a" />
      {[168, 280].map((x) => <g key={x}><rect x={x} y="134" width="26" height="30" rx="13" fill="#9fe0ff" /><rect x={x} y="176" width="26" height="30" rx="13" fill="#9fe0ff" /></g>)}
    </g>
    <Tree x={40} s={1.05} /><Tree x={372} s={.9} c="#3bb26e" />
    <rect x="-300" y="214" width="1000" height="600" fill="#58bf6b" /><rect x="-300" y="214" width="1000" height="600" fill="#3a9a52" />
    <path d="M-300 252 L0 252 Q200 238 400 252 L700 252 L700 700 L-300 700Z" fill="#e8cf9a" />
    {/* laughing classmates in the background */}
    <Kid x={338} y={236} s={.78} mood="laugh" shirt="#e0592a" hair="#1a1a1a" />
    <Kid x={372} y={244} s={.7} mood="laugh" kind="girl" shirt="#4a86e8" scarf="#f6c244" />
    {tier && <></>}
  </>);
}

function Home() {
  return (<>
    <rect x="-300" y="-300" width="1000" height="1000" fill="#f4d9a4" />
    <rect x="-300" y="0" width="1000" height="236" fill="#f1cf93" /><rect x="-300" y="200" width="1000" height="600" fill="#c9954f" />
    <rect x="-300" y="236" width="1000" height="600" fill="#9b6238" /><path d="M-300 262 H700 M-300 284 H700" stroke="#7d4a28" strokeWidth="3" />
    <g {...OUT}>
      <rect x="40" y="38" width="108" height="110" rx="10" fill="#ffd89a" /><rect x="48" y="46" width="92" height="94" rx="6" fill="url(#sky-dusk)" />
      <path d="M94 46 V140 M48 93 H140" stroke={INK} strokeWidth="3" /><circle cx="116" cy="74" r="12" fill="#fff2b0" stroke="none" />
      <path d="M30 34 Q50 100 34 160 L56 160 Q48 100 62 34Z" fill="#0e7c5a" /><path d="M150 34 Q130 100 146 160 L124 160 Q132 100 118 34Z" fill="#0e7c5a" />
      <rect x="210" y="52" width="70" height="52" rx="6" fill="#fff6df" /><path d="M222 78 q8 -14 16 0 t16 0" fill="none" stroke="#0e7c5a" strokeWidth="3" /><circle cx="245" cy="68" r="4" fill="#f6c244" stroke="none" />
      <rect x="300" y="150" width="86" height="86" rx="10" fill="#0e7c5a" /><rect x="296" y="140" width="94" height="22" rx="10" fill="#0a5f45" />
      <path d="M170 236 L170 150 L176 150 L176 236 M150 150 H196 L184 120 H162Z" fill="#c9954f" />
    </g>
    <path d="M-300 236 L0 236 Q200 226 400 236 L700 236" fill="none" stroke="#7d4a28" strokeWidth="3" />
  </>);
}

function Class({ tier }: { tier: Tier | null }) {
  return (<>
    <rect x="-300" y="-300" width="1000" height="1000" fill="#cfe8d5" /><rect x="-300" y="228" width="1000" height="600" fill="#c79a62" /><path d="M-300 252 H700 M-300 276 H700" stroke="#a97c45" strokeWidth="3" />
    <g {...OUT}>
      <rect x="86" y="38" width="228" height="112" rx="8" fill="#0a5a43" /><rect x="86" y="146" width="228" height="8" fill="#8b5a2b" />
      <path d="M110 72 h34 M127 55 v34 M170 70 h30 M170 84 h30 M232 62 l28 28 M260 62 l-28 28" stroke="#fff" strokeWidth="4" fill="none" opacity=".85" />
      <circle cx="352" cy="62" r="22" fill="#fff6df" /><path d="M352 62 V48 M352 62 L362 68" stroke={INK} strokeWidth="3" fill="none" />
      <rect x="20" y="52" width="46" height="54" rx="4" fill="#9fe0ff" /><path d="M43 52 V106 M20 79 H66" stroke={INK} strokeWidth="2.5" />
      <rect x="150" y="196" width="100" height="14" rx="3" fill="#b9773a" /><rect x="158" y="210" width="8" height="30" fill="#8b5a2b" /><rect x="234" y="210" width="8" height="30" fill="#8b5a2b" />
    </g>
    <g {...OUT}><rect x="168" y="178" width="30" height="20" rx="3" fill="#f6c244" /><rect x="208" y="182" width="26" height="16" rx="3" fill="#fff" /></g>
    {tier === "react" && <g className="rg-pop"><text x="266" y="150" fontSize="34" fontWeight="900" fill="#ff5a3c" stroke={INK} strokeWidth="2">?!</text></g>}
  </>);
}

function Play({ tier }: { tier: Tier | null }) {
  return (<>
    <rect x="-300" y="-300" width="1000" height="1000" fill="url(#sky-day)" />
    <g className="rg-drift"><Cloud x={60} y={46} s={.9} /><Cloud x={260} y={64} s={.8} /></g>
    <Tree x={46} s={1.1} c="#3bb26e" />
    <rect x="-300" y="216" width="1000" height="600" fill="#58bf6b" /><rect x="-300" y="216" width="1000" height="600" fill="#3a9a52" />
    <g {...OUT}>
      <path d="M312 232 V150 Q312 128 340 128 H382 V150 Q364 150 364 172 V232Z" fill="#f6c244" /><path d="M312 150 L292 232" stroke={INK} strokeWidth="6" fill="none" />
      <rect x="120" y="198" width="74" height="10" rx="3" fill="#8b5a2b" /><rect x="128" y="206" width="6" height="30" fill="#6f4520" /><rect x="180" y="206" width="6" height="30" fill="#6f4520" />
    </g>
    <g transform={`translate(270 ${tier === "best" ? 200 : 224})`} className={tier === "best" ? "rg-bounce" : ""}><circle r="11" fill="#fff" stroke={INK} strokeWidth="3" /><path d="M-8 -3 Q0 4 8 -3 M0 -11 V11" stroke={INK} strokeWidth="2.4" fill="none" /></g>
    <Kid x={330} y={238} s={.74} mood="happy" shirt="#e0592a" hair="#1a1a1a" />
    <Kid x={376} y={246} s={.66} mood="laugh" kind="girl" shirt="#4a86e8" scarf="#f6c244" />
  </>);
}

function Desk({ tier }: { tier: Tier | null }) {
  const fixed = tier === "best";
  return (<>
    <rect x="-300" y="-300" width="1000" height="1000" fill="#1c4a58" /><rect x="-300" y="228" width="1000" height="600" fill="#5c3a21" />
    <g {...OUT}>
      <rect x="248" y="34" width="110" height="96" rx="8" fill="#ffd89a" /><rect x="256" y="42" width="94" height="80" rx="4" fill="#0b1f3a" />
      <path d="M303 42 V122 M256 82 H350" stroke={INK} strokeWidth="3" />
    </g>
    <path d="M330 56 a14 14 0 1 0 8 24 a11 11 0 1 1 -8 -24z" fill="#ffe08a" /><g fill="#fff"><circle cx="270" cy="60" r="2" /><circle cx="286" cy="104" r="1.6" /><circle cx="328" cy="104" r="2" /></g>
    <g {...OUT}><rect x="24" y="60" width="86" height="60" rx="5" fill="#fff6df" /><circle cx="52" cy="90" r="14" fill="#0e7c5a" /><path d="M76 78 h22 M76 92 h22 M76 106 h16" stroke={INK} strokeWidth="3" fill="none" /></g>
    {/* project on the desk */}
    <g {...OUT} transform="translate(54 0)">
      <rect x="20" y="206" width="236" height="14" rx="3" fill="#a9703a" /><rect x="34" y="220" width="10" height="20" fill="#7d4a28" /><rect x="232" y="220" width="10" height="20" fill="#7d4a28" />
      <g transform={fixed ? "" : "rotate(-8 160 190)"}>
        <rect x="104" y="140" width="116" height="66" rx="4" fill="#fff6df" />
        <circle cx="132" cy="173" r="16" fill="#f6c244" /><ellipse cx="170" cy="173" rx="30" ry="12" fill="none" strokeDasharray="4 4" /><circle cx="196" cy="168" r="6" fill="#4a86e8" /><circle cx="150" cy="184" r="4" fill="#e0592a" />
        {!fixed && <path d="M104 140 L150 206 M220 140 L176 190" stroke="#c9954f" strokeWidth="3" fill="none" />}
      </g>
      {!fixed && <><path d="M90 214 l12 -10 8 12z M236 212 l14 -6 4 12z" fill="#fff6df" /></>}
      {fixed && <path d="M122 138 h80" stroke="#f6c244" strokeWidth="5" />}
    </g>
  </>);
}

export default function Scene({ scene, you, other, tier }: { scene: SceneId; you: Mood; other: Mood; tier: Tier | null }) {
  const sparkle = tier === "best";
  const heat = you === "angry";
  return (
    <svg className="rg-scene" viewBox="0 44 400 216" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Game scene" focusable="false">
      <defs>
        <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7fd3ff" /><stop offset="1" stopColor="#ffeab8" /></linearGradient>
        <linearGradient id="sky-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff9a5c" /><stop offset="1" stopColor="#ffd89a" /></linearGradient>
      </defs>
      {scene === "yard" && <Yard tier={tier} />}
      {scene === "home" && <Home />}
      {scene === "class" && <Class tier={tier} />}
      {scene === "play" && <Play tier={tier} />}
      {scene === "desk" && <Desk tier={tier} />}

      {/* the player (left) and the other person (right) */}
      {scene === "yard" && <><Kid x={110} mood={you} shirt="#0e7c5a" badge steam={heat} sparkle={sparkle} /><Kid x={262} flip mood={other} shirt="#e0592a" hair="#1a1a1a" skin="#d9a273" /></>}
      {scene === "home" && <><Kid x={104} mood={you} shirt="#0e7c5a" badge steam={heat} sparkle={sparkle} /><Kid x={268} flip mood={other} kind="adult" shirt="#c64f7a" scarf="#7a3b6b" /></>}
      {scene === "class" && <><Kid x={110} mood={you} shirt="#0e7c5a" badge steam={heat} sparkle={sparkle} /><Kid x={290} flip mood={other === "neutral" ? "sad" : other} shirt="#4a86e8" hair="#3b2416" skin="#d9a273" /></>}
      {scene === "play" && <><Kid x={110} mood={you} shirt="#0e7c5a" badge steam={heat} sparkle={sparkle} /><Kid x={214} s={.9} flip mood={other} shirt="#8a6ad8" hair="#2a1a12" pants="#444" sit /></>}
      {scene === "desk" && <><Kid x={62} mood={you} shirt="#0e7c5a" badge steam={heat} sparkle={sparkle} /><Kid x={346} s={.72} flip mood={other === "neutral" ? "sad" : other} shirt="#f6c244" hair="#1a1a1a" skin="#e2aa80" /></>}
    </svg>
  );
}
