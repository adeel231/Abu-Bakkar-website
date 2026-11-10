// Public contact number (international format, digits only, no +). Override with NEXT_PUBLIC_WHATSAPP_NUMBER.
// The old number (923335760892) was replaced in Nov 2026; it is ignored even if a hosting env var still holds it.
const envWa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
export const WHATSAPP = envWa && envWa !== "923335760892" ? envWa : "923335767202";
export const WHATSAPP_PRETTY = "+" + WHATSAPP.replace(/^(\d{2})(\d{3})(\d+)$/, "$1 $2 $3");

// Meta Pixel IDs (public, not secrets). Every browser event goes to all of them.
//  - 989476746933754 "Abu Bakkar": owned by the Abu Bakkar Academy business and its ad account (the main one).
//  - 2200034287537050 "Abu bakkar new": created under the techup.ai business, so it isn't visible there.
// Override with NEXT_PUBLIC_META_PIXEL_ID (one ID, or several separated by commas).
const envPixels = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").split(",").map((x) => x.trim()).filter((x) => /^\d+$/.test(x));
export const META_PIXEL_IDS = envPixels.length ? envPixels : ["989476746933754", "2200034287537050"];
/** The main pixel (Abu Bakkar Academy ad account); used for the server-side Conversions API. */
export const META_PIXEL_ID = META_PIXEL_IDS[0];
