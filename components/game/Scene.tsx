import type { Mood, SceneId, Tier } from "./gameData";

// Flat vector scenes in a chunky outlined style (no images to download). viewBox 400 x 300, ground line near y = 236.
const INK = "#052a1f";
const OUT = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" } as const;

type KidProps = {
  x: number; y?: number; s?: number; flip?: boolean; mood: Mood;
  skin?: string; shirt: string; pants?: string; hair?: string;
  kind?: "kid" | "adult" | "girl" | "parent"; scarf?: string; badge?: boolean; steam?: boolean; sparkle?: boolean; sit?: boolean;
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
  const grown = kind === "adult" || kind === "parent";
  const sc = grown ? s * (kind === "adult" ? 1.22 : 1.16) : s;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -sc : sc} ${sc})`}>
      <ellipse cx="0" cy="2" rx="30" ry="6" fill="#000" opacity=".22" />
      <g className={`rg-bob ${mood === "angry" ? "rg-shake" : ""}`}>
        <g {...OUT}>
          {!sit && <><rect x="-15" y="-40" width="13" height="40" rx="5" fill={grown ? "#2d3b55" : pants} /><rect x="2" y="-40" width="13" height="40" rx="5" fill={grown ? "#2d3b55" : pants} />
          <ellipse cx="-9" cy="-1" rx="11" ry="5" fill="#fff" /><ellipse cx="9" cy="-1" rx="11" ry="5" fill="#fff" /></>}
          {sit && <><rect x="-18" y="-40" width="36" height="13" rx="5" fill={pants} /><rect x="-18" y="-30" width="13" height="30" rx="5" fill={pants} /><rect x="5" y="-30" width="13" height="30" rx="5" fill={pants} /></>}
          {grown && <path d="M-24 -90 Q-27 -50 -22 -30 L22 -30 Q27 -50 24 -90 Z" fill={shirt} />}
          {!grown && <rect x="-23" y="-90" width="46" height="56" rx="16" fill={shirt} />}
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
          {kind === "parent" && <path d="M-24 -110 Q-26 -137 0 -137 Q26 -137 24 -110 Q18 -123 6 -125 Q-8 -115 -24 -110 Z" fill={hair} />}
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

function Study() {
  return (<>
    <rect x="-300" y="-300" width="1000" height="1000" fill="#d7e9d2" />
    <rect x="-300" y="236" width="1000" height="600" fill="#b98a58" /><path d="M-300 262 H700 M-300 284 H700" stroke="#9a6f40" strokeWidth="3" />
    <g {...OUT}>
      <rect x="30" y="56" width="78" height="76" rx="5" fill="#9fe0ff" /><path d="M69 56 V132 M30 94 H108" strokeWidth="2.5" />
      <rect x="168" y="196" width="178" height="12" rx="3" fill="#b9773a" /><rect x="178" y="208" width="9" height="30" fill="#8b5a2b" /><rect x="328" y="208" width="9" height="30" fill="#8b5a2b" />
      <rect x="182" y="176" width="48" height="20" rx="2" fill="#fff" /><path d="M206 176 V196 M188 182 h12 M188 188 h12 M212 182 h12 M212 188 h12" strokeWidth="1.6" />
      <path d="M338 196 V160 L322 142" fill="none" /><path d="M308 136 h26 l-6 14 h-14z" fill="#f6c244" />
      <rect x="116" y="198" width="38" height="38" rx="10" fill="#e0592a" /><rect x="124" y="208" width="22" height="12" rx="3" fill="#f6c244" strokeWidth="2" />
    </g>
  </>);
}

/** The two report cards on the coffee table (the child's and the cousin's). */
function ReportProps() {
  return (
    <g {...OUT}>
      <rect x="156" y="206" width="88" height="10" rx="3" fill="#b9773a" /><rect x="164" y="216" width="8" height="22" fill="#8b5a2b" /><rect x="228" y="216" width="8" height="22" fill="#8b5a2b" />
      <g transform="translate(164 182) rotate(-5)"><rect width="32" height="25" rx="2" fill="#fff" strokeWidth="2" /><text x="16" y="18" textAnchor="middle" fontSize="12" fontWeight="900" fill="#e0592a" stroke="none">62%</text></g>
      <g transform="translate(204 184) rotate(5)"><rect width="32" height="25" rx="2" fill="#fff" strokeWidth="2" /><text x="16" y="18" textAnchor="middle" fontSize="12" fontWeight="900" fill="#1f9d57" stroke="none">91%</text></g>
    </g>
  );
}

/** The toy the two children are arguing about. */
function Blocks() {
  return (
    <g {...OUT}>
      <rect x="236" y="220" width="22" height="16" rx="3" fill="#e0592a" /><rect x="260" y="226" width="16" height="10" rx="2" fill="#4a86e8" />
      <rect x="244" y="205" width="16" height="14" rx="2" fill="#f6c244" transform="rotate(-10 252 212)" />
    </g>
  );
}

export default function Scene({ scene, you, other, other2, tier }: { scene: SceneId; you: Mood; other: Mood; other2?: Mood; tier: Tier | null }) {
  const sparkle = tier === "best";
  const heat = you === "angry";
  // The player is the parent (left). The child (right) is the one who speaks.
  const parent = { mood: you, shirt: "#0e7c5a", hair: "#2a1a12", badge: true, steam: heat, sparkle } as const;
  return (
    <svg className="rg-scene" viewBox="0 44 400 216" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Game scene" focusable="false">
      <defs>
        <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7fd3ff" /><stop offset="1" stopColor="#ffeab8" /></linearGradient>
        <linearGradient id="sky-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff9a5c" /><stop offset="1" stopColor="#ffd89a" /></linearGradient>
      </defs>
      {scene === "study" ? <Study /> : <Home />}
      {scene === "report" && <ReportProps />}
      {scene === "siblings" && <Blocks />}

      {scene === "home" && <><Kid x={104} kind="parent" {...parent} /><Kid x={268} flip mood={other} shirt="#e0592a" hair="#1a1a1a" skin="#d9a273" /></>}
      {scene === "guests" && <>
        <Kid x={338} y={238} s={.56} kind="adult" mood="shock" shirt="#c64f7a" scarf="#7a3b6b" /><Kid x={376} y={244} s={.5} kind="girl" mood="shock" shirt="#4a86e8" scarf="#f6c244" />
        <Kid x={88} kind="parent" {...parent} /><Kid x={232} flip mood={other} s={.92} shirt="#e0592a" hair="#1a1a1a" skin="#d9a273" /></>}
      {scene === "study" && <><Kid x={88} kind="parent" {...parent} /><Kid x={278} flip mood={other} shirt="#4a86e8" hair="#3b2416" skin="#d9a273" /></>}
      {scene === "report" && <><Kid x={82} kind="parent" {...parent} /><Kid x={292} flip mood={other} shirt="#4a86e8" hair="#3b2416" skin="#d9a273" /></>}
      {scene === "siblings" && <><Kid x={64} kind="parent" {...parent} /><Kid x={196} mood={other} shirt="#e0592a" hair="#1a1a1a" skin="#d9a273" /><Kid x={318} s={.78} flip mood={other2 ?? "sad"} kind="girl" shirt="#8a6ad8" scarf="#f6c244" /></>}
    </svg>
  );
}
