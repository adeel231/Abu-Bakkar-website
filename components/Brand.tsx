import Link from "next/link";
import Image from "next/image";

/** Compact logo (no tagline) for the navbar and small headers; pass full for the logo with the tagline pill.
 *  Served through next/image so the 600 KB originals are sent as small WebP files sized for the screen. */
export function Logo({ full = false }: { light?: boolean; full?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center">
      {full ? (
        <Image src="/logo.png" width={2172} height={724} sizes="416px" priority alt="Abu Bakkar Academy — Sirf Taleem Nahi, Tarbiyat Bhi" className="h-auto w-full max-w-[26rem]" />
      ) : (
        <Image src="/logo-compact.png" width={1955} height={625} sizes="200px" priority alt="Abu Bakkar Academy" className="h-12 w-auto sm:h-14 lg:h-16" />
      )}
    </Link>
  );
}
