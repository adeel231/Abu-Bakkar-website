// Content for "Agar Abu Bakkar Hota To Kya Karta?" (the Response Challenge).
// Copy rule for this site: no commas. Every level has three responses: the Abu Bakkar way (best) and a half answer (okay) and a reaction (react).

export type Tier = "best" | "okay" | "react";
export type Mood = "neutral" | "angry" | "sad" | "calm" | "smug" | "laugh" | "shock" | "happy";
export type SceneId = "yard" | "home" | "class" | "play" | "desk";

export type Response = {
  tier: Tier;
  title: string;          // short card title
  detail: string;         // one line under it
  outcome: string;        // what happens next (shown right after the choice)
  you: Mood;              // how the player's character looks afterwards
  other: Mood;            // how the other character looks afterwards
};

export type Level = {
  id: number;
  scene: SceneId;
  quality: string;        // badge name (Sabr / Izzat / Sach / Rehm / Hal)
  chapter: string;        // level title
  speaker: string;        // who is talking
  line: string;           // what they say or what happens
  ask: string;            // the question
  responses: [Response, Response, Response];
  lesson: string;         // the lesson in one line
  say: string;            // practical sentence to try
  dinner: string;         // question for the family table
};

export const LEVELS: Level[] = [
  {
    id: 1, scene: "yard", quality: "Sabr", chapter: "Mazaaq", speaker: "Dost",
    line: "Hahaha! Dekho iski shakal! Sab ke saamne bhi aise hi chalta hai!",
    ask: "Koi aapke bachay ka mazaaq uraye to?",
    responses: [
      { tier: "react", title: "Gusse se jawab", detail: "Usay bhi beizzat kar dunga", outcome: "Awaaz oonchi hui aur sab hans pade. Ab masla pehle se bada hai.", you: "angry", other: "laugh" },
      { tier: "okay", title: "Chup rehna", detail: "Kuch nahi kahunga", outcome: "Baat tham gayi magar dil mein chubhan reh gayi. Woh agli baar phir karega.", you: "sad", other: "smug" },
      { tier: "best", title: "Sukoon se jawab", detail: "Yeh mazaaq mujhe achha nahi laga", outcome: "Sab chup ho gaye. Dost ne sorry kaha. Izzat bhi bachi aur dosti bhi.", you: "calm", other: "shock" },
    ],
    lesson: "Sabr kamzori nahi hai. Sukoon se boundary rakhna asal himmat hai.",
    say: "Mujhe yeh baat achi nahi lagi. Please dobara aisa mat karna.",
    dinner: "Jab koi aapka mazaaq uraye to aap kya mehsoos karte hain? Hum sukoon se kya keh sakte hain?",
  },
  {
    id: 2, scene: "home", quality: "Izzat", chapter: "Ammi Ki Baat", speaker: "Ammi",
    line: "Nahi beta. Abhi yeh nahi ho sakta. Meri baat khatam.",
    ask: "Ammi aapki baat nahi samajh rahin. Ab kya?",
    responses: [
      { tier: "react", title: "Chilla kar manwana", detail: "Meri baat suno abhi", outcome: "Ammi ki aankhon mein dukh aa gaya. Ghar ka mahaul bhaari ho gaya.", you: "angry", other: "sad" },
      { tier: "best", title: "Adab se samjhana", detail: "Kya main apni baat keh sakta hoon", outcome: "Ammi ne muskura kar kaha. Chalo bolo. Aaj pehli baar poori baat suni gayi.", you: "calm", other: "happy" },
      { tier: "okay", title: "Baat daba dena", detail: "Chalo koi baat nahi", outcome: "Jhagra nahi hua magar baat dil mein rah gayi. Ammi ko pata hi nahi chala.", you: "sad", other: "neutral" },
    ],
    lesson: "Izzat ka matlab chup rehna nahi. Adab ke saath apni baat rakhna hai.",
    say: "Ammi main aapki baat samajhta hoon. Kya main bhi apna point share kar sakta hoon?",
    dinner: "Kya aapko kabhi laga ke ghar mein aapki baat nahi suni gayi? Hum adab se kaise keh sakte hain?",
  },
  {
    id: 3, scene: "class", quality: "Sach", chapter: "Dost Ka Jhoot", speaker: "Best friend",
    line: "Yaar teacher ko bol do ke maine homework tumhare ghar bhool diya tha. Please!",
    ask: "Best friend jhoot bolne ko kehta hai. Aap kya karenge?",
    responses: [
      { tier: "best", title: "Saath doonga jhoot nahi", detail: "Chalo sach bata kar hal karte hain", outcome: "Dost pehle ghabraya phir maan gaya. Teacher ne sach ki qadar ki.", you: "calm", other: "happy" },
      { tier: "okay", title: "Baat taal dena", detail: "Dekhte hain baad mein", outcome: "Masla wahin laga raha. Dost ko madad nahi mili aur waqt nikal gaya.", you: "neutral", other: "sad" },
      { tier: "react", title: "Dosti ke liye jhoot", detail: "Theek hai bol doonga", outcome: "Teacher ko shak hua. Ab dono ka bharosa daaw par lag gaya.", you: "shock", other: "shock" },
    ],
    lesson: "Asal dosti sach bol kar bhi nibhayi ja sakti hai.",
    say: "Main tumhari madad karna chahta hoon magar jhoot nahi bolunga. Chalo saath chal kar sach batate hain.",
    dinner: "Kya dosti ke liye jhoot bolna theek hai? Sacchi madad kaisi hoti hai?",
  },
  {
    id: 4, scene: "play", quality: "Rehm", chapter: "Akela Bacha", speaker: "Aap ne dekha",
    line: "Class mein ek bacha akela baitha hai. Baaki sab apne game mein masroof hain.",
    ask: "Woh bacha kisi ne shamil nahi kiya. Aap kya karenge?",
    responses: [
      { tier: "okay", title: "Dekh kar guzar jaana", detail: "Mera kya lena dena", outcome: "Aap nikal gaye. Woh bacha poori chutti akela raha.", you: "neutral", other: "sad" },
      { tier: "react", title: "Us ka mazaaq banana", detail: "Sab ke saath hans doonga", outcome: "Woh bacha aur sikud gaya. Ab usay school aana bhi bura lagega.", you: "laugh", other: "sad" },
      { tier: "best", title: "Saath bulana", detail: "Chalo hamare saath khelo", outcome: "Uski aankhein chamak uthin. Aaj usay ek dost mil gaya.", you: "happy", other: "happy" },
    ],
    lesson: "Ek choti si dawat kisi ka poora din badal sakti hai.",
    say: "Agar tum chaho to hamare saath aa sakte ho.",
    dinner: "Aaj kisi ne aapko shamil kiya ya aapne kisi ko? Kal hum kis ko bula sakte hain?",
  },
  {
    id: 5, scene: "desk", quality: "Hal", chapter: "Tooti Mehnat", speaker: "Chhota bhai",
    line: "Oops! Bhaiya maine sirf haath lagaya tha! Mujhe nahi pata kaise toot gaya!",
    ask: "Chhote bhai ne aapka project kharab kar diya. Ab kya?",
    responses: [
      { tier: "react", title: "Cheezein phenk dena", detail: "Tum ne sab kharab kar diya", outcome: "Chhota bhai ro pada aur ghar mein shor mach gaya. Project phir bhi toota hi raha.", you: "angry", other: "sad" },
      { tier: "okay", title: "Kamray se chale jana", detail: "Kuch nahi bolunga", outcome: "Dhamaka nahi hua magar project wahin pada raha aur dil bhaari raha.", you: "sad", other: "sad" },
      { tier: "best", title: "Saans lo phir hal dhoondo", detail: "Chalo milkar theek karte hain", outcome: "Dono ne milkar project jora. Chhota bhai ne seekha aur aap ne bhi.", you: "calm", other: "happy" },
    ],
    lesson: "React karne se nuksaan barhta hai. Respond karne se hal milta hai.",
    say: "Mujhe bura laga. Ab dekhte hain hum isay kaise theek kar sakte hain.",
    dinner: "Jab kisi se nuksaan ho jaye to pehle kya karein? Saans lena kaise madad karta hai?",
  },
];

export const POINTS: Record<Tier, number> = { best: 100, okay: 40, react: 0 };
/** Best answers in a row are worth more: 100 125 150 175 200. */
export const comboBonus = (combo: number) => Math.max(0, combo - 1) * 25;
export const MAX_XP = LEVELS.reduce((s, _, i) => s + POINTS.best + i * 25, 0);   // 750

export const SABR_DELTA: Record<Tier, number> = { best: 18, okay: 4, react: -22 };

export type Rank = { key: string; title: string; sub: string; min: number };
export const RANKS: Rank[] = [
  { key: "champion", title: "Abu Bakkar Champion", sub: "Aap ne har situation mein soch samajh kar respond kiya.", min: 750 },
  { key: "star", title: "Sabr Star", sub: "Aap ke zyada tar jawab sukoon aur izzat wale the.", min: 450 },
  { key: "learner", title: "Samajhdar Musafir", sub: "Aap ne kai achhe jawab chune. Aur seekhna baaqi hai.", min: 250 },
  { key: "new", title: "Naya Safar", sub: "Har jawab ek sabaq hai. Yeh situations bachon ke saath phir se discuss karein.", min: 0 },
];
export const rankFor = (xp: number) => RANKS.find((r) => xp >= r.min) ?? RANKS[RANKS.length - 1];
