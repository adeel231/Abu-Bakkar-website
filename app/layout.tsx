import type { Metadata, Viewport } from "next";
import "./globals.css";
import Analytics from "@/components/Analytics";
import ChatWidget from "@/components/ChatWidget";
import { WHATSAPP } from "@/lib/contact";
import { localPhone } from "@/lib/chatbot/facts";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.abubakkaracademy.com"),
  title: "Abu Bakkar Academy — Online Character Grooming & Tuition",
  description: "Sirf Taleem Nahi, Tarbiyat Bhi. Live online Character Grooming from Rs. 7,000 per month for ages 5 to 15, plus Academic Tuition. Enroll online.",
};
export const viewport: Viewport = { themeColor: "#0B1F3A", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        {/* The assistant only appears once an AI key is set in the hosting settings. */}
        {process.env.OPENAI_API_KEY ? <ChatWidget phone={localPhone(WHATSAPP)} whatsapp={WHATSAPP} /> : null}
      </body>
    </html>
  );
}
