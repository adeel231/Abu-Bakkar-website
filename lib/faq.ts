import type { Catalog } from "./db";
import { formatPKR, monthlyPackage } from "./pricing";

/** Parent FAQs. Every price is read from the catalog so the answers always match the packages on the page. */
export function buildFaq(c: Catalog): [string, string][] {
  const cg = c.programs.find((p) => p.kind === "character");
  const monthly = cg ? monthlyPackage(c.packages, cg.id, "group") : undefined;
  const fee = formatPKR(monthly?.price_pkr ?? 7000);

  return [
    ["What are the monthly fees?",
      `Character Grooming Online Group classes are ${fee} per month: 1 hour per class, 4 days a week, live online.`],
    ["Which age group will my child join?",
      "Group A is ages 5 to 8 (manners and kindness). Group B is ages 8 to 12 (respect and patience). Group C is ages 12 to 15 (responsibility and emotional intelligence). Ages 8 and 12 fit two groups, so you choose one and our team confirms the best placement. Boys and girls can both enroll."],
    ["What are the class schedules?",
      "Classes are live online. When you enroll, tell us your preferred timing: morning, afternoon, evening or night. After your payment is verified we confirm your child's class time and send the joining link on WhatsApp."],
    ["How do I pay?",
      "Pay by JazzCash, Easypaisa or bank transfer, then upload a photo or screenshot of your receipt on the payment page. We confirm the money in our account before enrolling your child."],
    ["How does enrollment work?",
      "1) Tap Enroll Now. 2) Select your child's age group. 3) Enter parent and student details and see your total. 4) Pay and upload your receipt. 5) We verify the payment. 6) You receive your Enrollment ID and joining instructions on WhatsApp. There are no surveys and no compulsory consultation call."],
    ["What are the cancellation and refund rules?",
      "If we cannot start your class, you get a full refund. Before your first class you can cancel for a full refund. After classes start, the months already started are charged at the regular monthly price and the unused full months are refunded. Please read our Refund Policy for the full details and examples."],
    ["Who teaches the classes?", "Classes are taught by qualified teachers for each age group. Your joining message includes your teacher's name and class details."],
    ["Is there homework?", "Yes, short practical activities such as daily habits and conversations at home. They involve the family and are not a burden for the child."],
    ["How will I know my child's progress?", "You receive parent guidance and feedback during the program."],
  ];
}
