import ServiceShell from "@/components/ServiceShell";
import QuranSection from "@/components/QuranSection";

export const metadata = {
  title: "Online Quran Classes — Abu Bakkar Academy",
  description: "Live online Quran classes: Nazra, Tajweed, Qirat, Hifz-ul-Quran, Quranic Arabic and Tafseer.",
};

export default function QuranPage() {
  return (
    <ServiceShell back>
      <QuranSection />
    </ServiceShell>
  );
}
