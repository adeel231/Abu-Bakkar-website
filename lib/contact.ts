// Public contact number (international format, digits only, no +). Override with NEXT_PUBLIC_WHATSAPP_NUMBER.
// The old number (923335760892) was replaced in Nov 2026; it is ignored even if a hosting env var still holds it.
const envWa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
export const WHATSAPP = envWa && envWa !== "923335760892" ? envWa : "923335767202";
export const WHATSAPP_PRETTY = "+" + WHATSAPP.replace(/^(\d{2})(\d{3})(\d+)$/, "$1 $2 $3");

// Meta Pixel ID (public, not a secret). Override with NEXT_PUBLIC_META_PIXEL_ID.
// The old pixel (989476746933754) was replaced in Nov 2026; it is ignored even if a hosting env var still holds it.
const OLD_PIXEL = "989476746933754";
const envPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
export const META_PIXEL_ID = envPixel && envPixel !== OLD_PIXEL ? envPixel : "2200034287537050";
