"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Baby, Check, ChevronLeft, HeartHandshake, User, Users } from "lucide-react";
import { WhatsAppIcon } from "@/components/Chrome";
import {
  CLASS_TYPE_LABEL, formatPKR, groupsForAge, isBoundaryAge, isLimited, monthlyPackage, perMonth, plan, savings,
  seatsFor, totalPayable, type AgeGroup, type BatchLite, type ClassType, type Pkg,
} from "@/lib/pricing";
import { captureCampaign, currentSource, sessionId, track } from "@/components/Tracker";
import { metaBrowserIds } from "@/components/Analytics";

type Program = { id: string; slug: string; name: string; kind: "character" | "tuition"; tagline: string; description: string };
type Subject = { id: string; name: string };
type Props = {
  programs: Program[]; packages: Pkg[]; ageGroups: AgeGroup[]; subjects: Subject[]; batches: BatchLite[];
  timingOptions: string[]; threshold: number; whatsapp: string; initial: { program?: string; type?: string; term?: string; for?: string };
};

const GRADES = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Other"];
type SubjectChoice = "all" | "compulsory";
const SUBJECT_CHOICES: [SubjectChoice, string, string][] = [
  ["all", "All subjects", "Every subject we teach."],
  ["compulsory", "Compulsory subjects", "Only the compulsory subjects."],
];
// Character Grooming is offered for children or for parents (same plans and prices).
type Audience = "children" | "parent";
const AUDIENCES: [Audience, string, string][] = [
  ["children", "Children Grooming", "For boys and girls aged 5 to 15."],
  ["parent", "Parent Grooming", "For mothers and fathers."],
];
const AUDIENCE_LABEL: Record<Audience, string> = { children: "Children Grooming", parent: "Parent Grooming" };
// Step numbers: 0 Service · 1 For · 2 Class type · 3 Package · 4 Student · 5 Details · 6 Review
const STEPS = ["Service", "For", "Class type", "Package", "Student", "Details", "Review"];
const REVIEW = 6;

export default function EnrollWizard(p: Props) {
  const router = useRouter();
  const top = useRef<HTMLDivElement>(null);

  // Class types that still have a package on sale for a program (Private is no longer offered).
  const typesFor = (progId: string) => (["group", "private"] as ClassType[]).filter((t) => p.packages.some((k) => k.program_id === progId && k.class_type === t));
  const startProgram = p.programs.find((x) => x.slug === p.initial.program || x.kind === p.initial.program)?.id ?? "";
  const startTypes = startProgram ? typesFor(startProgram) : [];
  const askedType = (p.initial.type === "group" || p.initial.type === "private") ? p.initial.type : "";
  // An old link may still ask for "private": fall back to the only type on offer.
  const startType: ClassType | "" = askedType && startTypes.includes(askedType) ? askedType : startTypes.length === 1 ? startTypes[0] : "";
  const startAudience: Audience | "" = p.initial.for === "children" || p.initial.for === "parent" ? p.initial.for : "";
  const [programId, setProgramId] = useState(startProgram);
  const [classType, setClassType] = useState<ClassType | "">(startProgram ? startType : "");
  const [audience, setAudience] = useState<Audience | "">(startAudience);
  const [pkgId, setPkgId] = useState("");
  const [age, setAge] = useState("");
  const [ageGroupId, setAgeGroupId] = useState("");
  const [grade, setGrade] = useState("");
  const [subjectChoice, setSubjectChoice] = useState<SubjectChoice | "">("");
  const [f, setF] = useState({ parent_name: "", whatsapp: "", email: "", city: "", student_first_name: "", timing: "", consent: false, website: "" });
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const program = p.programs.find((x) => x.id === programId);
  const tuition = program?.kind === "tuition";
  const forParent = !tuition && audience === "parent";
  const options = useMemo(() => (programId && classType ? plan(p.packages, programId, classType) : []), [p.packages, programId, classType]);
  const pkg = p.packages.find((x) => x.id === pkgId);
  const ageNum = Number(age);
  const ageOk = Number.isInteger(ageNum) && ageNum >= 3 && ageNum <= 19;
  const eligible = ageOk ? groupsForAge(ageNum, p.ageGroups) : [];
  const group = p.ageGroups.find((g) => g.id === ageGroupId);

  const isCharacter = (progId: string) => p.programs.find((x) => x.id === progId)?.kind === "character";
  // Whether a step is shown for a set of choices. Steps with only one possible answer are skipped.
  function visible(i: number, progId: string, aud: Audience | "", type: ClassType | ""): boolean {
    if (i === 1) return isCharacter(progId);
    if (i === 2) return typesFor(progId).length > 1;
    if (i === 3) return !type || plan(p.packages, progId, type).length > 1;
    if (i === 4) return !(isCharacter(progId) && aud === "parent");
    return true;
  }
  const nextVisible = (from: number, progId: string, aud: Audience | "", type: ClassType | "") => {
    let i = from + 1; while (i < REVIEW && !visible(i, progId, aud, type)) i++; return i;
  };

  // Jump to the first unfinished step when the page was opened with choices already made (from the homepage buttons).
  useEffect(() => {
    if (!startProgram) return;
    if (isCharacter(startProgram) && !startAudience) return setStep(1);   // Children or Parent Grooming first
    if (startType) {
      const opts = plan(p.packages, startProgram, startType);
      const t = p.programs.find((x) => x.id === startProgram)?.kind === "tuition";
      const want = p.initial.term && opts.find((o) => o.duration_key === p.initial.term);
      const pick = want || (t ? opts[0] : monthlyPackage(p.packages, startProgram, startType) ?? opts[0]);
      if (pick) setPkgId(pick.id);
      setStep(nextVisible(t || want ? 3 : 2, startProgram, startAudience, startType));
    } else setStep(nextVisible(isCharacter(startProgram) ? 1 : 0, startProgram, startAudience, ""));
  }, []); // eslint-disable-line

  // Choosing an age auto-selects the age group when there is only one fit.
  useEffect(() => {
    if (tuition || !ageOk) { if (!ageOk) setAgeGroupId(""); return; }
    if (!eligible.some((g) => g.id === ageGroupId)) setAgeGroupId(eligible.length === 1 ? eligible[0].id : "");
  }, [age, tuition]); // eslint-disable-line

  const status = (type: ClassType, ag: string | null) => {
    const s = seatsFor(p.batches, programId, type, ag);
    return { full: s.hasBatches && s.left <= 0, limited: isLimited(s.hasBatches, s.left, p.threshold), left: s.left };
  };
  const typeStatus = (type: ClassType) => {
    if (tuition) return status(type, null);
    const all = p.ageGroups.map((g) => status(type, g.id));
    return { full: all.length > 0 && all.every((s) => s.full), limited: all.some((s) => s.limited), left: 0 };
  };

  const matchingBatches = useMemo(() => {
    if (!programId || !classType) return [];
    return seatsFor(p.batches, programId, classType, ageGroupId || null).batches.filter((b) => b.left > 0);
  }, [p.batches, programId, classType, ageGroupId]);

  function go(n: number) { setErr(""); setStep(n); setTimeout(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30); }
  function touched() { if (!started.current) { started.current = true; track("form_start"); } }
  const set = (k: keyof typeof f, v: string | boolean) => { touched(); setF((o) => ({ ...o, [k]: v })); };

  function chooseProgram(id: string) {
    setProgramId(id); setClassType(""); setPkgId(""); setAgeGroupId(""); setGrade(""); setSubjectChoice(""); setAudience("");
    if (isCharacter(id)) return go(1);   // Children Grooming or Parent Grooming first
    afterAudience(id, "");
  }
  function chooseAudience(a: Audience) {
    touched(); setAudience(a); setAgeGroupId("");
    afterAudience(programId, a);
  }
  function afterAudience(progId: string, aud: Audience | "") {
    const ts = typesFor(progId);
    if (ts.length === 1) chooseType(ts[0], progId, aud);   // only one class type on offer: nothing to choose
    else go(2);
  }
  function chooseType(t: ClassType, progId = programId, aud: Audience | "" = audience) {
    setClassType(t);
    const opts = plan(p.packages, progId, t);
    const isTuition = p.programs.find((x) => x.id === progId)?.kind === "tuition";
    setPkgId((isTuition ? opts[0] : monthlyPackage(p.packages, progId, t) ?? opts[0])?.id ?? "");
    go(nextVisible(2, progId, aud, t));
  }
  // Back skips the steps that had only one choice.
  function back() {
    let i = step - 1;
    while (i > 0 && !visible(i, programId, audience, classType)) i--;
    go(Math.max(0, i));
  }

  function validate(s: number): string {
    if (s === 0 && !programId) return "Please choose a service.";
    if (s === 1 && !tuition && !audience) return "Please choose Children Grooming or Parent Grooming.";
    if (s === 2 && !classType) return "Please choose a class type.";
    if (s === 3 && !pkg) return "Please choose a package.";
    if (s === 4 && !forParent) {
      if (!ageOk) return "Please enter the student's age (3 to 19).";
      if (!tuition && !ageGroupId) return eligible.length ? "Please choose an age group." : "Character Grooming is for ages 5 to 15. Please message us on WhatsApp for other ages.";
      if (tuition && (!grade || !subjectChoice)) return "Please select the school grade and choose All subjects or Compulsory subjects.";
    }
    if (s === 5) {
      if (f.parent_name.trim().length < 2) return "Please enter the parent's full name.";
      if (!/^(\+?92|0)?3\d{9}$/.test(f.whatsapp.replace(/[\s-]/g, ""))) return "Please enter a valid WhatsApp number, e.g. 0333 1234567.";
      if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return "That email address does not look right.";
      if (f.city.trim().length < 2) return "Please enter your city.";
      if (!forParent && !f.student_first_name.trim()) return "Please enter the student's first name.";
      if (!f.consent) return "Please tick the parent consent box.";
    }
    return "";
  }
  function next() { const m = validate(step); if (m) return setErr(m); go(nextVisible(step, programId, audience, classType)); }

  async function submit() {
    for (const s of [0, 1, 2, 3, 4, 5]) { const m = validate(s); if (m) { setErr(m); setStep(s); return; } }
    if (!pkg) return;
    setBusy(true); setErr("");
    const batchId = f.timing.startsWith("batch:") ? f.timing.slice(6) : "";
    const timingText = batchId ? (matchingBatches.find((b) => b.id === batchId)?.timing ?? "") : f.timing;
    const camp = captureCampaign();
    const res = await fetch("/api/enroll", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        package_id: pkg.id, expected_amount: totalPayable(pkg),
        parent_name: f.parent_name, whatsapp: f.whatsapp, email: f.email, city: f.city,
        // Parent Grooming: the parent is the learner, so their own name is the student name and there is no child age.
        student_first_name: forParent ? f.parent_name.trim().slice(0, 50) : f.student_first_name, student_age: forParent ? "" : ageNum,
        audience: tuition ? "" : audience,
        age_group_id: tuition || forParent ? "" : ageGroupId, school_grade: tuition ? grade : "", subject_choice: tuition ? subjectChoice : "",
        preferred_timing: timingText, preferred_batch_id: batchId, consent: f.consent, website: f.website,
        source: currentSource(), utm: Object.fromEntries(Object.entries(camp).filter(([, v]) => v)), session_id: sessionId(),
        ...metaBrowserIds(),
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false); setErr(j.error || "Something went wrong. Please try again.");
      if (/price/i.test(j.error || "")) router.refresh();
      return;
    }
    router.push(`/pay/${j.ref}`);
  }

  const card = (active: boolean, disabled = false) =>
    `block w-full rounded-2xl border-2 p-4 text-left transition md:p-5 ${disabled ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60" : active ? "border-emerald bg-emerald-50 shadow" : "border-slate-200 bg-white hover:border-emerald/50"}`;
  const tag = (t: string, tone: "gold" | "red" | "green" = "gold") =>
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone === "gold" ? "bg-gold text-navy" : tone === "red" ? "bg-red-100 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{t}</span>;

  // Progress shows only the steps the parent will actually see: steps with just one possible answer are skipped.
  const progs = programId ? [programId] : p.programs.map((x) => x.id);
  const shown = STEPS.map((label, i) => ({ label, i })).filter(({ i }) => progs.some((id) => {
    if (i === 3) return typesFor(id).some((t) => (!classType || t === classType) && plan(p.packages, id, t).length > 1);
    return visible(i, id, id === programId ? audience : "", classType);
  }));
  const pos = Math.max(0, shown.filter(({ i }) => i <= step).length - 1);

  return (
    <div ref={top} className="scroll-mt-24">
      {/* progress */}
      <ol className="flex items-center gap-1" aria-label="Enrollment steps">
        {shown.map(({ label }, n) => (
          <li key={label} className="flex flex-1 flex-col items-center gap-1">
            <span className={`h-1.5 w-full rounded-full ${n <= pos ? "bg-emerald" : "bg-slate-200"}`} />
            <span className={`hidden text-[11px] sm:block ${n === pos ? "font-bold text-navy" : "text-slate-500"}`}>{label}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-sm font-semibold text-emerald-700 sm:hidden">Step {pos + 1} of {shown.length}: {shown[pos]?.label}</p>

      {/* running summary */}
      {pkg && step > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-navy px-4 py-3 text-white">
          <div className="min-w-0 text-sm">
            <p className="truncate font-semibold">{program?.name}{audience && !tuition ? ` · ${AUDIENCE_LABEL[audience]}` : ""} · {classType ? CLASS_TYPE_LABEL[classType] : ""}</p>
            <p className="text-white/70">{pkg.label}{group ? ` · ${group.label}` : ""}</p>
          </div>
          <p className="shrink-0 text-lg font-extrabold text-gold">{formatPKR(totalPayable(pkg))}</p>
        </div>
      )}

      <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm md:p-7" onFocusCapture={() => step >= 4 && touched()}>
        {/* STEP 0 — service */}
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-bold text-navy">Choose a service</h2>
            <div className="mt-5 grid gap-3">
              {p.programs.map((g) => {
                const cheapest = p.packages.filter((k) => k.program_id === g.id).sort((a, b) => a.price_pkr - b.price_pkr)[0];
                const monthly = g.kind === "character";
                return (
                  <button key={g.id} type="button" onClick={() => chooseProgram(g.id)} className={card(programId === g.id)}>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-navy">{g.name}</span>
                      {g.kind === "character" && tag("Main program")}
                    </span>
                    {cheapest && <span className="mt-2 block font-semibold text-emerald-700">{monthly ? "From" : "From"} {formatPKR(cheapest.price_pkr)}{monthly ? " / month" : ` / ${cheapest.label.toLowerCase()}`}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 1 — who is it for (Character Grooming) */}
        {step === 1 && program && !tuition && (
          <div>
            <h2 className="text-2xl font-bold text-navy">Who is it for?</h2>
            <div className="mt-5 grid gap-3" role="radiogroup" aria-label="Who is it for">
              {AUDIENCES.map(([key, title, note]) => (
                <button key={key} type="button" role="radio" aria-checked={audience === key} onClick={() => chooseAudience(key)} className={card(audience === key)}>
                  <span className="flex items-center gap-2">
                    {key === "children" ? <Baby size={20} className="text-emerald-700" /> : <HeartHandshake size={20} className="text-emerald-700" />}
                    <span className="text-lg font-bold text-navy">{title}</span>
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">{note}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — class type */}
        {step === 2 && program && (
          <div>
            <h2 className="text-2xl font-bold text-navy">Group or private?</h2>
            <div className="mt-5 grid gap-3">
              {(["group", "private"] as ClassType[]).map((t) => {
                const mp = tuition ? plan(p.packages, programId, t)[0] : monthlyPackage(p.packages, programId, t);
                if (!mp) return null;
                const st = typeStatus(t);
                return (
                  <button key={t} type="button" disabled={st.full} onClick={() => chooseType(t)} className={card(classType === t, st.full)}>
                    <span className="flex flex-wrap items-center gap-2">
                      {t === "group" ? <Users size={20} className="text-emerald-700" /> : <User size={20} className="text-emerald-700" />}
                      <span className="text-lg font-bold text-navy">{CLASS_TYPE_LABEL[t]}</span>
                      {st.full ? tag("Seats full", "red") : st.limited ? tag("Limited seats") : null}
                    </span>
                    <span className="mt-2 block text-2xl font-extrabold text-navy">{formatPKR(mp.price_pkr)} <span className="text-sm font-medium text-slate-500">{tuition ? `/ ${mp.label.toLowerCase()}` : "/ month"}</span></span>
                    <span className="mt-1 block text-sm font-medium text-emerald-700">{mp.schedule_note}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3 — package */}
        {step === 3 && program && classType && (
          <div>
            <h2 className="text-2xl font-bold text-navy">{tuition ? "Your package" : "Choose a plan"}</h2>
            <p className="mt-1 text-slate-600">{tuition ? "12 live sessions per month." : "Pay monthly, or pay ahead and save."}</p>
            <div className="mt-5 grid gap-3">
              {options.map((o) => {
                const sv = savings(o, monthlyPackage(p.packages, programId, classType));
                const monthly = o.months === 1;
                return (
                  <button key={o.id} type="button" onClick={() => setPkgId(o.id)} className={card(pkgId === o.id)}>
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${pkgId === o.id ? "border-emerald bg-emerald text-white" : "border-slate-300"}`}>{pkgId === o.id && <Check size={12} />}</span>
                        <span className="font-bold text-navy">{o.label}{monthly && !tuition ? " (standard)" : ""}</span>
                        {sv > 0 && tag(`Save ${formatPKR(sv)}`, "green")}
                      </span>
                      <span className="text-right">
                        {sv > 0 && <span className="block text-sm text-slate-400 line-through">{formatPKR(o.price_pkr + sv)}</span>}
                        <span className={`font-extrabold text-navy ${monthly ? "text-2xl" : "text-xl"}`}>{formatPKR(o.price_pkr)}</span>
                      </span>
                    </span>
                    <span className="mt-1 block pl-7 text-sm text-slate-600">
                      {o.months > 1 ? `${formatPKR(perMonth(o))} per month · pay once for ${o.months} months` : tuition ? `${o.sessions ?? 12} sessions · pay once` : "Pay month by month"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4 — student (skipped for Parent Grooming) */}
        {step === 4 && program && !forParent && (
          <div>
            <h2 className="text-2xl font-bold text-navy">How old is your child?</h2>
            <div className="mt-4 max-w-[12rem]">
              <label className="label" htmlFor="age">Age</label>
              <input id="age" className="input" inputMode="numeric" type="number" min={3} max={19} value={age} onChange={(e) => { touched(); setAge(e.target.value); }} placeholder="e.g. 9" />
            </div>

            {!tuition && (
              <div className="mt-5">
                <p className="label">Choose a group</p>
                <div className="grid gap-3">
                  {p.ageGroups.map((g) => {
                    const fits = ageOk && eligible.some((e) => e.id === g.id);
                    const st = classType ? status(classType, g.id) : { full: false, limited: false, left: 0 };
                    const off = (ageOk && !fits) || st.full;
                    return (
                      <button key={g.id} type="button" disabled={off} onClick={() => { touched(); setAgeGroupId(g.id); }} className={card(ageGroupId === g.id, off)}>
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-navy">{g.label}: Ages {g.min_age} to {g.max_age}</span>
                          {st.full ? tag("Seats full", "red") : st.limited ? tag("Limited seats") : null}
                        </span>
                        <span className="mt-1 block text-sm text-slate-600">Focus: {g.focus}</span>
                      </button>
                    );
                  })}
                </div>
                {ageOk && isBoundaryAge(ageNum, p.ageGroups) && <p className="mt-3 rounded-xl bg-gold/15 p-3 text-sm text-navy">Age {ageNum} fits two groups. Pick one, we will confirm.</p>}
                {ageOk && !eligible.length && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">Character Grooming is for ages 5 to 15.</p>}
                {!ageOk && <p className="mt-3 text-sm text-slate-500">Enter the age to see the right group.</p>}
              </div>
            )}

            {tuition && (
              <div className="mt-5 space-y-5">
                <div className="max-w-xs">
                  <label className="label" htmlFor="grade">School grade</label>
                  <select id="grade" className="input" value={grade} onChange={(e) => { touched(); setGrade(e.target.value); }}>
                    <option value="">Select grade</option>{GRADES.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <p className="label">Which subjects?</p>
                  <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Subjects">
                    {SUBJECT_CHOICES.map(([key, title, note]) => (
                      <button key={key} type="button" role="radio" aria-checked={subjectChoice === key} onClick={() => { touched(); setSubjectChoice(key); }} className={card(subjectChoice === key)}>
                        <span className="flex items-center gap-2">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${subjectChoice === key ? "border-emerald bg-emerald text-white" : "border-slate-300"}`}>{subjectChoice === key && <Check size={12} />}</span>
                          <span className="text-lg font-bold text-navy">{title}</span>
                        </span>
                        <span className="mt-1 block pl-7 text-sm text-slate-600">{note}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-emerald-700">Same price for both choices.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5 — details */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-navy">Your details</h2>
            <div><label className="label" htmlFor="pn">Your name</label><input id="pn" className="input" autoComplete="name" value={f.parent_name} onChange={(e) => set("parent_name", e.target.value)} /></div>
            <div><label className="label" htmlFor="wa">WhatsApp number</label><input id="wa" className="input" inputMode="tel" autoComplete="tel" placeholder="0333 1234567" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /><p className="mt-1 text-xs text-slate-500">We send class details here.</p></div>
            <div><label className="label" htmlFor="em">Email (optional)</label><input id="em" type="email" className="input" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div><label className="label" htmlFor="ct">City</label><input id="ct" className="input" autoComplete="address-level2" value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
            {!forParent && <div><label className="label" htmlFor="sn">Child's first name</label><input id="sn" className="input" value={f.student_first_name} onChange={(e) => set("student_first_name", e.target.value)} /></div>}
            <div>
              <label className="label" htmlFor="tm">Preferred time</label>
              <select id="tm" className="input" value={f.timing} onChange={(e) => set("timing", e.target.value)}>
                <option value="">No preference</option>
                {matchingBatches.length > 0 && <optgroup label="Available classes">
                  {matchingBatches.map((b) => <option key={b.id} value={"batch:" + b.id}>{b.name}{b.timing ? ` — ${b.timing}` : ""} ({b.left} seats left)</option>)}
                </optgroup>}
                <optgroup label="Time of day">{p.timingOptions.map((t) => <option key={t}>{t}</option>)}</optgroup>
              </select>
              <p className="mt-1 text-xs text-slate-500">We confirm the time after payment.</p>
            </div>
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={f.website} onChange={(e) => set("website", e.target.value)} />
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-emerald" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
              <span>I am the parent or guardian. I agree to the <a href="/privacy" target="_blank" className="underline">Privacy Policy</a> and <a href="/refund-policy" target="_blank" className="underline">Refund Policy</a>.</span>
            </label>
          </div>
        )}

        {/* STEP 6 — review */}
        {step === REVIEW && pkg && program && classType && (
          <div>
            <h2 className="text-2xl font-bold text-navy">Check and confirm</h2>
            <dl className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 text-sm">
              {([
                ["Service", program.name], ...(audience && !tuition ? [["For", AUDIENCE_LABEL[audience]]] : []),
                ["Class type", CLASS_TYPE_LABEL[classType]], ["Package", pkg.label],
                ...(tuition ? [["School grade", grade], ["Subjects", SUBJECT_CHOICES.find(([k]) => k === subjectChoice)?.[1] ?? ""]]
                  : forParent ? [] : [["Age group", group ? `${group.label} (ages ${group.min_age}–${group.max_age})` : ""]]),
                ...(forParent ? [] : [["Student", `${f.student_first_name}, age ${age}`]]), ["Parent", f.parent_name], ["WhatsApp", f.whatsapp], ["City", f.city],
                ["Preferred timing", f.timing.startsWith("batch:") ? (matchingBatches.find((b) => b.id === f.timing.slice(6))?.name ?? "") : f.timing || "No preference"],
              ] as string[][]).map(([k, v]) => <div key={k} className="flex justify-between gap-4 p-3"><dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold text-navy">{v}</dd></div>)}
            </dl>
            <div className="mt-5 rounded-2xl bg-navy p-5 text-white">
              <p className="text-sm text-white/70">Total to pay</p>
              <p className="text-4xl font-extrabold text-gold">{formatPKR(totalPayable(pkg))}</p>
              <p className="mt-1 text-sm text-white/70">{pkg.schedule_note}</p>
            </div>
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>Pay by JazzCash, Easypaisa or bank.</li>
              <li>Upload your payment receipt.</li>
              <li>Get your class details on WhatsApp.</li>
            </ol>
          </div>
        )}

        {err && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {step > 0 ? <button type="button" onClick={back} className="btn border-2 border-slate-300 text-navy"><ChevronLeft size={18} className="mr-1" />Back</button> : <span />}
          {step >= 3 && step < REVIEW && <button type="button" onClick={next} className="btn-emerald">Continue</button>}
          {step === REVIEW && <button type="button" disabled={busy} onClick={submit} className="btn-gold disabled:opacity-60">{busy ? "Please wait…" : "Continue to Payment"}</button>}
        </div>
      </div>

      {/* Clear way to get help at every step */}
      <a href={`https://wa.me/${p.whatsapp}?text=${encodeURIComponent("Assalamu Alaikum, I need help with enrollment.")}`} target="_blank" rel="noopener"
        onClick={() => track("enroll_click")}
        className="mt-5 flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-5 py-4 text-white shadow-lg shadow-[#25D366]/25 transition hover:brightness-105">
        <WhatsAppIcon className="h-7 w-7 shrink-0" />
        <span className="text-left leading-tight">
          <span className="block text-xs font-medium text-white/90">Questions? Need help?</span>
          <span className="block text-base font-bold">Chat with us on WhatsApp</span>
        </span>
      </a>
    </div>
  );
}
