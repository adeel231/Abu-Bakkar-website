// Content for "Agar Abu Bakkar Hota To Kya Karta?" (the Response Challenge). The PLAYER IS THE PARENT: five everyday parenting
// moments where every option has a reason behind it. Even the best answer has a cost.
// LANGUAGE RULE: simple everyday Roman Urdu, the way people text. No bookish or poetic words. Copy rule for this site: no commas.
// Every level has three responses: the Abu Bakkar way (best) and a comfortable half answer (okay) and a reaction (react).

export type Tier = "best" | "okay" | "react";
export type Mood = "neutral" | "angry" | "sad" | "calm" | "smug" | "laugh" | "shock" | "happy";
export type SceneId = "home" | "guests" | "study" | "report" | "siblings";

export type Response = {
  tier: Tier;
  title: string;          // short card title
  detail: string;         // one line under it
  outcome: string;        // what happens next (shown right after the choice) including what it cost
  you: Mood;              // how the parent looks afterwards
  other: Mood;            // how the child looks afterwards
  other2?: Mood;          // the second child (siblings scene only)
};

export type Level = {
  id: number;
  scene: SceneId;
  quality: string;        // badge name
  chapter: string;        // level title
  speaker: string;        // who is talking
  otherStart: Mood;       // how the child looks before the parent answers
  other2Start?: Mood;
  line: string;           // what they say
  ask: string;            // the question
  responses: [Response, Response, Response];
  lesson: string;         // the lesson in one line
  say: string;            // practical sentence to try
  dinner: string;         // question to talk about at home tonight
};

export const LEVELS: Level[] = [
  {
    id: 1, scene: "home", quality: "Sabr", chapter: "Mazaaq", speaker: "Aap ka bacha", otherStart: "sad",
    line: "Woh roz sab ke saamne mera mazaaq udata hai. Mujhe school nahi jana!",
    ask: "Koi aap ke bachay ka mazaaq udaye to aap kya karenge?",
    responses: [
      { tier: "react", title: "Gusse se jawab", detail: "Tum bhi usay maar do", outcome: "Bacha larai mein phans gaya aur school se phone aa gaya. Baat aur bigad gayi.", you: "angry", other: "sad" },
      { tier: "okay", title: "Chup rehna", detail: "Bacha hai bhool jayega", outcome: "Bacha chup ho gaya magar dil mein dukh rakha. Ab woh aap ko kuch nahi batata.", you: "sad", other: "sad" },
      { tier: "best", title: "Sukoon se jawab", detail: "Pehle poori baat suno phir teacher se baat karo", outcome: "Bachay ko laga ke koi us ki sunta hai. Teacher ne dhyan diya magar masla theek hone mein ek do hafte lage.", you: "calm", other: "calm" },
    ],
    lesson: "Bachay ko badla nahi aap ka saath chahiye. Pehle us ki baat sunein phir araam se bolna sikhayein. Zaroorat ho to school se bhi baat karein.",
    say: "Mujhe batao kya hua. Main tumhare saath hoon. Hum mil kar iska hal nikalte hain.",
    dinner: "Aaj school mein kis baat se bura laga? Aisi baat par hum araam se kya keh sakte hain?",
  },
  {
    id: 2, scene: "guests", quality: "Qaabu", chapter: "Mehmaano Ke Saamne", speaker: "Aap ka bacha", otherStart: "angry",
    line: "Mujhe phone chahiye abhi! Abhi do! Warna main khana nahi khaunga!",
    ask: "Mehmaano ke saamne aap ka 8 saal ka bacha phone ke liye chilla raha hai. Aap kya karenge?",
    responses: [
      { tier: "best", title: "Alag le ja kar mana karna", detail: "Phone abhi nahi. Rona theek hai chillana nahi", outcome: "Bacha thori der aur roya. Mehmaano ke saamne sharminda hona pada magar bachay ne dekh liya ke aap ka na na hi rehta hai.", you: "calm", other: "sad" },
      { tier: "react", title: "Wahin chilla kar daantna", detail: "Chup ho jao abhi!", outcome: "Bacha aur zor se roya aur mehmaan ghabra gaye. Aap ko bhi bura laga.", you: "angry", other: "sad" },
      { tier: "okay", title: "Phone de dena", detail: "Chalo sab ke saamne tamasha na ho", outcome: "Shor band ho gaya aur mehmaan muskuraye. Magar bachay ne seekh liya ke chillane se phone mil jata hai.", you: "neutral", other: "smug" },
    ],
    lesson: "Mehmaano ki sharm mein aa kar limit mat todein. Bachay ko alag le ja kar pyaar se samjhayein ke chillane se kuch nahi milta.",
    say: "Mujhe pata hai tumhein phone chahiye. Abhi nahi milega. Chalo alag baat karte hain.",
    dinner: "Ghar mein phone ya screen ki kya limit rakhein jo sab ko pata ho?",
  },
  {
    id: 3, scene: "study", quality: "Bharosa", chapter: "Jhoot", speaker: "Aap ka bacha", otherStart: "neutral",
    line: "Maine homework kar liya tha! Copy school mein reh gayi!",
    ask: "Aap ko pata hai ke bachay ne homework ka jhoot bola hai. Pehle aap kya karenge?",
    responses: [
      { tier: "okay", title: "Ignore kar dena", detail: "Chhodo isay", outcome: "Baat khatam ho gayi magar bachay ne seekha ke jhoot chal jata hai.", you: "neutral", other: "smug" },
      { tier: "best", title: "Araam se bolna ke pata hai", detail: "Sach bata do main gussa nahi hoon", outcome: "Bacha pehle sharminda hua aur chup raha phir sach bol diya. Bharosa wapas banne mein thora time lagega.", you: "calm", other: "sad" },
      { tier: "react", title: "Chilla kar saza dena", detail: "Tum ne jhoot bola!", outcome: "Bacha dar gaya aur ro diya. Agli baar woh jhoot aur achhe se chhupayega.", you: "angry", other: "sad" },
    ],
    lesson: "Bachay tab jhoot bolte hain jab sach bolne se dar lagta hai. Sach bolna safe banayein aur galti par araam se baat karein.",
    say: "Mujhe pata hai kuch theek nahi hai. Sach bata do. Hum mil kar dekhte hain.",
    dinner: "Kya hamare ghar mein sach bolna safe hai? Isay aur aasaan kaise bana sakte hain?",
  },
  {
    id: 4, scene: "report", quality: "Hausla", chapter: "Cousin Ke Number", speaker: "Khala", otherStart: "sad",
    line: "Hai hai sirf 62 percent? Hamari Ayesha ke to 91 aaye hain! Beta kya hua?",
    ask: "Cousin ke 91 aaye hain aur Khala sab ke saamne poochh rahi hain. Ghar aa kar bachay ke saath aap kya karenge?",
    responses: [
      { tier: "react", title: "Cousin se compare karna", detail: "Dekho us ke kitne number aaye!", outcome: "Bacha toot gaya aur bola ke main hi bura hoon. Number aur kam ho sakte hain.", you: "angry", other: "sad" },
      { tier: "best", title: "Saath baith kar poochna", detail: "Kya mushkil thi? Ek chhota goal rakho", outcome: "Bachay ne apni mushkil batayi. Khala ko pyaar se rokna pada aur unhein bura laga.", you: "calm", other: "calm" },
      { tier: "okay", title: "Result ki baat hi na karna", detail: "Bacha pareshan na ho", outcome: "Us raat sab theek raha magar masla wahin ka wahin. Bachay ne socha ke aap ko parwah nahi.", you: "neutral", other: "sad" },
    ],
    lesson: "Doosron se compare karne se bacha tootta hai. Pehle samjhein ke mushkil kya thi phir ek chhota goal rakhein.",
    say: "Mujhe tumhari mehnat par bharosa hai. Batao kis cheez mein mushkil hui? Hum mil kar aage badhte hain.",
    dinner: "Kya hum apne bachay ko kisi aur se compare kar dete hain? Aaj us ki kaun si achhi baat humne kahi?",
  },
  {
    id: 5, scene: "siblings", quality: "Insaaf", chapter: "Bhai Behen Ka Jhagra", speaker: "Bara bacha", otherStart: "angry", other2Start: "sad",
    line: "Isne pehle shuru kiya! Maine kuch nahi kiya! Yeh jhoot bol raha hai!",
    ask: "Do bachay lad rahe hain. Aap ne shuru hote nahi dekha. Aap kya faisla karenge?",
    responses: [
      { tier: "okay", title: "Dono ko barabar daantna", detail: "Dono ki ghalti hai bas chup ho jao!", outcome: "Jhagra ruk gaya magar dono ko laga ke aap ne un ki baat suni hi nahi.", you: "neutral", other: "angry", other2: "sad" },
      { tier: "react", title: "Bade ko daant dena", detail: "Tum bade ho tumhein samajhna chahiye", outcome: "Bade ko laga ke us ke saath na-insaafi hui. Chhote ne seekh liya ke rone se kaam ban jata hai.", you: "angry", other: "sad", other2: "smug" },
      { tier: "best", title: "Dono ki baat alag alag sunna", detail: "Phir mil kar hal nikalne dena", outcome: "Dono ne apni baat kahi aur mil kar hal nikala. Time laga aur koi poora jeeta nahi.", you: "calm", other: "calm", other2: "happy" },
    ],
    lesson: "Faisla karne se pehle dono ki baat sunein. Bade ko bada hone ki saza na dein aur dono ko hal nikalna sikhayein.",
    say: "Maine shuru hote nahi dekha. Pehle tum batao phir tum. Phir hum mil kar faisla karte hain.",
    dinner: "Jhagre mein hum pehle kis ki sunte hain? Kya hum bade bachay se zyada umeed rakhte hain?",
  },
];

export const POINTS: Record<Tier, number> = { best: 100, okay: 40, react: 0 };
/** Best answers in a row are worth more: 100 125 150 175 200. */
export const comboBonus = (combo: number) => Math.max(0, combo - 1) * 25;
export const MAX_XP = LEVELS.reduce((s, _, i) => s + POINTS.best + i * 25, 0);   // 750

export const SABR_DELTA: Record<Tier, number> = { best: 18, okay: 4, react: -22 };

export type Rank = { key: string; title: string; sub: string; min: number };
export const RANKS: Rank[] = [
  { key: "champion", title: "Abu Bakkar Champion", sub: "Aap ne har jagah gusse se pehle soch kar jawab diya.", min: 750 },
  { key: "star", title: "Sabr Star", sub: "Aap ke zyada tar jawab araam aur samajh wale the.", min: 450 },
  { key: "learner", title: "Samajhdar Parent", sub: "Kai achhe jawab diye. Thora aur seekhna baaqi hai.", min: 250 },
  { key: "new", title: "Naya Safar", sub: "Har jawab se kuch na kuch seekhne ko milta hai. Yeh baatein ghar par bhi karke dekhein.", min: 0 },
];
export const rankFor = (xp: number) => RANKS.find((r) => xp >= r.min) ?? RANKS[RANKS.length - 1];
