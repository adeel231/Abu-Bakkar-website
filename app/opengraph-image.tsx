import { ImageResponse } from "next/og";

export const alt = "Abu Bakkar Academy — Sirf Taleem Nahi, Tarbiyat Bhi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic"; // avoids a Windows build-time path issue; rendered on request

// Branded share preview. Replace with your logo artwork (public/logo.png) by embedding it here if desired.
export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80,
        background: "linear-gradient(135deg,#0B1F3A 0%,#0E7C5A 100%)", color: "white" }}>
        <div style={{ display: "flex", fontSize: 34, color: "#D4A017", letterSpacing: 8, fontWeight: 700 }}>ABU BAKKAR ACADEMY</div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.1, marginTop: 28 }}>
          Abu Bakkar Ne Sab Ka Dil Kyun Jeeta?
        </div>
        <div style={{ display: "flex", fontSize: 38, marginTop: 28, color: "#e5e7eb" }}>Akhlaaq ki wajah se — taleem ke saath tarbiyat.</div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 40, color: "#D4A017", fontWeight: 700 }}>Sirf Taleem Nahi, Tarbiyat Bhi.</div>
      </div>
    ),
    size,
  );
}
