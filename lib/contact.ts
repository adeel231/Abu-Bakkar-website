// Public contact number (international format, digits only, no +). Override with NEXT_PUBLIC_WHATSAPP_NUMBER.
export const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923335760892";
export const WHATSAPP_PRETTY = "+" + WHATSAPP.replace(/^(\d{2})(\d{3})(\d+)$/, "$1 $2 $3");

// Meta Pixel ID (public, not a secret). Override with NEXT_PUBLIC_META_PIXEL_ID.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "989476746933754";
