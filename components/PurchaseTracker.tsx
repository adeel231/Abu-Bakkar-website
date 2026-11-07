"use client";
import { useEffect } from "react";
import { adEvent } from "./Analytics";

/** Fires the ad-platform "Purchase" once per enrollment, and only on a page that is shown for a VERIFIED payment.
 *  Sends value and currency only. The enrollment ID is used as the event id so the server-side copy isn't double counted. */
export default function PurchaseTracker({ refCode, amount }: { refCode: string; amount: number }) {
  useEffect(() => {
    const key = "aba_purchase_" + refCode;
    try { if (localStorage.getItem(key)) return; } catch {}
    adEvent("Purchase", { value: amount, currency: "PKR", transaction_id: refCode }, "purchase", refCode);
    try { localStorage.setItem(key, "1"); } catch {}
  }, [refCode, amount]);
  return null;
}

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="btn border-2 border-slate-300 text-navy print:hidden">Print / save receipt</button>;
}
