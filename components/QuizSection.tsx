import ShareButton from "./ShareButton";
import ScenarioQuiz from "./ScenarioQuiz";

/** "Agar Abu Bakkar Hota To Kya Karta?" interactive game. */
export default function QuizSection() {
  return (
    <section id="play" className="relative overflow-hidden bg-gradient-to-br from-[#0b5a3e] to-[#052a1f] text-white">
      <ShareButton id="play" tone="dark" corner="top-right" title="Agar Abu Bakkar Hota To Kya Karta?" text="A 1 minute game for parents. What would your child do? Don't React. Respond Like Abu Bakkar." />
      <div className="section">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">Try it with your child</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight md:text-5xl">Agar Abu Bakkar Hota To Kya Karta?</h2>
        </div>
        <div className="mt-8"><ScenarioQuiz /></div>
      </div>
    </section>
  );
}
