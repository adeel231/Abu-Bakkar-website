import type { Metadata, Viewport } from "next";
import "./globals.css";
import Analytics from "@/components/Analytics";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://abubakkaracademy.pk"),
  title: "Abu Bakkar Academy — Online Character Grooming & Tuition",
  description: "Sirf Taleem Nahi, Tarbiyat Bhi. Structured live online classes for Pakistani children: character, confidence and academics.",
};
export const viewport: Viewport = { themeColor: "#0B1F3A", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
