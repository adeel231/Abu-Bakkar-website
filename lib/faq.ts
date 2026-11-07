import type { Catalog } from "./db";
import { formatPKR, monthlyPackage, plan } from "./pricing";

/** Parent FAQs. Every price is read from the catalog so the answers always match the packages on the page. */
export function buildFaq(c: Catalog): [string, string][] {
  const cg = c.programs.find((p) => p.kind === "character");
  const at = c.programs.find((p) => p.kind === "tuition");
  const price = (progId: string | undefined, t: "group" | "private", key?: string) => {
    if (!progId) return "—";
    const p = key ? plan(c.packages, progId, t).find((x) => x.duration_key === key) : monthlyPackage(c.packages, progId, t) ?? plan(c.packages, progId, t)[0];
    return p ? formatPKR(p.price_pkr) : "—";
  };
  const g = (k?: string) => price(cg?.id, "group", k), p = (k?: string) => price(cg?.id, "private", k);

  return [
    ["What are the monthly fees?",
      `Character Grooming: Online Group classes are ${g()} per month (1 hour daily, 5 days a week). Private One-on-One classes are ${p()} per month (1 hour per session, 2 days a week). Academic Tuition is separate: Online Group ${price(at?.id, "group")} and Private One-on-One ${price(at?.id, "private")}, each for 4 weeks with 12 sessions.`],
    ["Can I pay for several months in advance?",
      `Yes, it is optional and saves money. Online Group: 3 months ${g("3m")}, 6 months ${g("6m")}. Private One-on-One: 3 months ${p("3m")}, 6 months ${p("6m")}. You can always choose to pay monthly instead.`],
    ["What is the difference between group and private classes?",
      "In group classes your child learns live with a small group of children of a similar age, every day, 5 days a week. In private classes your child is alone with the teacher for 1 hour, 2 days a week, which suits children who need personal attention or a flexible pace."],
    ["Which age group will my child join?",
      "Group A is ages 5 to 8 (manners, kindness and basic discipline). Group B is ages 8 to 12 (respect, patience and confidence). Group C is ages 12 to 15 (responsibility, emotional intelligence and leadership). Ages 8 and 12 fit two groups, so you choose one and our team confirms the best placement. Boys and girls can both enroll."],
    ["What are the class schedules?",
      "Classes are live online. When you enroll, tell us your preferred timing: morning, afternoon, evening or night. After your payment is verified we confirm your child's class time and send the joining link on WhatsApp."],
    ["How do I pay?",
      "Pay by JazzCash, Easypaisa or bank transfer, then enter your transaction ID on the payment page. We check it against our account. We never approve a payment from a screenshot."],
    ["How does enrollment work?",
      "1) Choose Character Grooming or Academic Tuition. 2) Choose Group or Private. 3) Choose Monthly or an advance package. 4) Select the age group, or the school grade and subject for tuition. 5) Enter parent and student details and see your total. 6) Pay and submit the transaction ID. 7) We verify the payment. 8) You receive your Enrollment ID and joining instructions on WhatsApp. There are no surveys and no compulsory consultation call."],
    ["What are the cancellation and refund rules?",
      "If we cannot start your class, you get a full refund. Before your first class you can cancel for a full refund. After classes start, the months already started are charged at the regular monthly price and the unused full months are refunded. Academic Tuition is refundable before the first session. Please read our Refund Policy for the full details and examples."],
    ["Who teaches the classes?", "Classes are taught by qualified teachers for each age group. Your joining message includes your teacher's name and class details."],
    ["Is there homework?", "Yes, short practical activities such as daily habits and conversations at home. They involve the family and are not a burden for the child."],
    ["How will I know my child's progress?", "You receive parent guidance and feedback during the program."],
  ];
}
