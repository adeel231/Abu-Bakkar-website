import Link from "next/link";

/** Compact logo (no tagline) for the navbar and small headers; pass full for the logo with the tagline pill. */
export function Logo({ full = false }: { light?: boolean; full?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center">
      {full ? (
        <img src="/logo.png" alt="Abu Bakkar Academy — Sirf Taleem Nahi, Tarbiyat Bhi" className="h-auto w-full max-w-[26rem]" />
      ) : (
        <img src="/logo-compact.png" alt="Abu Bakkar Academy" className="h-12 w-auto sm:h-14 lg:h-16" />
      )}
    </Link>
  );
}
