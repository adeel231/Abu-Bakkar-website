"use client";
import Script from "next/script";
import { useEffect, useState } from "react";

const GA = process.env.NEXT_PUBLIC_GA4_ID;
const PX = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GTM = process.env.NEXT_PUBLIC_GTM_ID;
const KEY = "aba_consent";

declare global {
  interface Window { fbq?: (...a: any[]) => void; gtag?: (...a: any[]) => void; dataLayer?: any[] }
}

/** Fire an ad-platform event. Only ever pass non-personal data (no names, ages, phones, emails). */
export function adEvent(meta: string, params?: Record<string, unknown>, ga?: string) {
  try {
    if (localStorage.getItem(KEY) !== "granted") return;
    const standard = ["PageView", "ViewContent", "Lead", "InitiateCheckout", "AddPaymentInfo", "Purchase", "Share"];
    if (standard.includes(meta)) window.fbq?.("track", meta, params); else window.fbq?.("trackCustom", meta, params);
    window.gtag?.("event", ga ?? meta.toLowerCase(), params);
  } catch {}
}

export default function Analytics() {
  const [consent, setConsent] = useState<"granted" | "denied" | null | undefined>(undefined);

  useEffect(() => {
    try { setConsent((localStorage.getItem(KEY) as any) ?? null); } catch { setConsent(null); }
  }, []);

  const choose = (v: "granted" | "denied") => {
    try { localStorage.setItem(KEY, v); } catch {}
    setConsent(v);
  };

  return (
    <>
      {consent === "granted" && GA && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`
            window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
            window.gtag=gtag;gtag('js',new Date());gtag('config','${GA}',{anonymize_ip:true,allow_google_signals:false});
          `}</Script>
        </>
      )}
      {consent === "granted" && GTM && (
        <Script id="gtm" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;
          f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM}');
        `}</Script>
      )}
      {consent === "granted" && PX && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
          s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${PX}');fbq('track','PageView');
        `}</Script>
      )}

      {consent === null && (
        <div role="dialog" aria-label="Cookie consent" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl bg-navy p-4 text-sm text-white shadow-2xl">
          <p>
            We use analytics and advertising cookies (Google Analytics, Meta Pixel) to measure our ads. We never send your
            child’s details to these services. See our <a className="underline" href="/privacy">Privacy Policy</a>.
          </p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => choose("granted")} className="btn-gold !py-2 !px-4 text-sm">Accept</button>
            <button onClick={() => choose("denied")} className="btn-outline !py-2 !px-4 text-sm">Decline</button>
          </div>
        </div>
      )}
    </>
  );
}
