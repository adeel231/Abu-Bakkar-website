import type { ReactNode } from "react";
import { EnrollLink } from "./Tracker";

type Props = {
  image: string; alt: string; imagePos?: string;            // e.g. "bg-[position:60%_20%]" for the mobile strip
  hook: string; sub: string[]; as?: "h1" | "h2";
  pill: ReactNode; paragraph: string; badge?: string;
  primary: { href: string; label: string }; secondary: { href: string; label: string };
  id?: string;
  /** The designed hero: a photo-only image cut from the 2001×786 banner (its right 61.5%); the section keeps the banner's proportions. */
  concept?: boolean;
  /** Optional element pinned inside the section (the Share button). */
  share?: ReactNode;
};

/** Full-width hero band: dark green, text on the left, photo on the right fading into the green.
 *  On large screens it keeps the proportions of the design image and scales with the screen width. */
export default function HeroBand({ image, alt, imagePos = "bg-[position:60%_20%]", hook, sub, as: H = "h2", pill, paragraph, badge, primary, secondary, id, concept, share }: Props) {
  const words = hook.split(" ");
  return (
    <section id={id} className={"relative isolate overflow-hidden bg-[#052a1f] text-white lg:aspect-[1571/768]" + (concept ? " lg:!aspect-[2001/786]" : "")}>
      <div role="img" aria-label={alt}
        className={concept
          ? "hero-photo hero-photo-soft order-last aspect-[1231/786] w-full bg-cover bg-no-repeat bg-center md:aspect-auto md:absolute md:inset-y-0 md:right-0 md:-z-10 md:h-auto md:w-[55%] md:bg-[position:40%_center] lg:w-[61.5%] lg:bg-[length:auto_100%] lg:bg-[position:right_center]"
          : `hero-photo order-last h-72 w-full bg-cover ${imagePos} md:absolute md:inset-y-0 md:right-0 md:-z-10 md:h-auto md:w-[50%] md:bg-[position:right_center] lg:w-[61.8%]`}
        style={{ backgroundImage: `url(${image})` }} />

      <div className={"mx-auto flex max-w-6xl flex-col justify-center px-5 py-16 md:py-20 lg:mx-0 lg:h-full lg:max-w-none lg:px-[1.6vw] lg:py-0" + (concept ? " lg:py-[1.4vw]" : "")}>
        <div className="max-w-xl md:max-w-[48%] lg:max-w-none lg:w-[40%]">
          {badge && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-navy lg:mb-[1.2vw] lg:px-[1.1vw] lg:py-[0.35vw] lg:text-[0.85vw]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" aria-hidden />{badge}
            </p>
          )}
          <H className="font-serif text-4xl font-bold leading-[1.1] md:text-5xl lg:text-[3.7vw]">
            {words.slice(0, -1).join(" ")} <span className="text-gold">{words.slice(-1)}</span>
          </H>
          <div className="mt-6 flex flex-col items-start gap-2 text-sm font-bold text-navy md:text-base lg:mt-[1.6vw] lg:gap-[0.5vw] lg:text-[1.1vw]">
            {sub.map((l, i) => (
              <p key={i} className={`rounded-sm px-4 py-2 shadow-lg lg:px-[1vw] lg:py-[0.55vw] ${i === 0 ? "bg-white" : "bg-gold"}`}>{l}</p>
            ))}
          </div>

          <p className="mt-8 font-sans text-3xl font-bold md:text-4xl lg:mt-[2.6vw] lg:text-[2.4vw]">Abu Bakkar Academy</p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold bg-gold/15 px-5 py-1.5 font-sans text-base font-bold text-gold md:text-lg lg:mt-[1.2vw] lg:px-[2vw] lg:py-[0.5vw] lg:text-[1.4vw]">
            {pill}
          </p>
          <p className="mt-5 max-w-md text-base text-white/90 md:text-lg lg:mt-[1.4vw] lg:max-w-none lg:w-[92%] lg:text-[1.2vw] lg:leading-relaxed">{paragraph}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row md:flex-col md:items-start lg:mt-[2vw] lg:flex-row lg:items-center lg:gap-[1vw]">
            <EnrollLink href={primary.href} className="btn-gold whitespace-nowrap !px-10 !py-4 text-base lg:!px-[2.6vw] lg:!py-[1.2vw] lg:text-[1.1vw]">{primary.label}</EnrollLink>
            <a href={secondary.href} className="btn-outline whitespace-nowrap !px-8 !py-4 text-base lg:!px-[2vw] lg:!py-[1.2vw] lg:text-[1.1vw]">{secondary.label}</a>
          </div>
        </div>
      </div>
      {share}
    </section>
  );
}
