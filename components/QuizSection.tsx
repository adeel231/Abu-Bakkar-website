import ResponseGame from "./game/ResponseGame";

/** "Agar Abu Bakkar Hota To Kya Karta?" the Response Challenge game. Lives on the homepage at /#play. */
export default function QuizSection({ price, schedule }: { price: string; schedule: string }) {
  return (
    <section id="play" className="relative overflow-hidden bg-gradient-to-br from-[#0b5a3e] to-[#052a1f] text-white">
      <div className="mx-auto max-w-6xl px-3 py-5 md:px-5 md:py-8">
        <h2 className="sr-only">Agar Abu Bakkar Hota To Kya Karta? Free family challenge</h2>
        <ResponseGame price={price} schedule={schedule} />
        <p className="mx-auto mt-5 max-w-md text-center text-xs leading-relaxed text-white/60">
          An educational game with no sign up. It does not collect names and is not an assessment of anyone’s character. Abu Bakkar Academy is independent and is not affiliated with any drama production or actor.
        </p>
      </div>
    </section>
  );
}
