"use client";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { META_PIXEL_IDS } from "@/lib/contact";

const GA = process.env.NEXT_PUBLIC_GA4_ID;
const PX = META_PIXEL_IDS.length > 0;
const GTM = process.env.NEXT_PUBLIC_GTM_ID;
const CLARITY = process.env.NEXT_PUBLIC_CLARITY_ID;

declare global {
  interface Window { fbq?: (...a: any[]) => void; gtag?: (...a: any[]) => void; dataLayer?: any[]; __abaPx?: any[][] | null; __abaGa?: any[][] | null }
}

/** Fire an ad-platform event. Only ever pass non-personal data (no names, ages, phones, emails). */
export function adEvent(meta: string, params?: Record<string, unknown>, ga?: string, eventId?: string) {
  try {
    const standard = ["PageView", "ViewContent", "Lead", "InitiateCheckout", "AddPaymentInfo", "Purchase", "Share"];
    const opts = eventId ? { eventID: eventId } : undefined;   // same id as the server-side event, so Meta counts it once
    send("fbq", "__abaPx", [standard.includes(meta) ? "track" : "trackCustom", meta, params, opts]);
    send("gtag", "__abaGa", ["event", ga ?? meta.toLowerCase(), params]);
  } catch {}
}

/** Call the tag now if it has loaded; otherwise hold the call until it loads.
 *  Without this, events fired as a page opens — e.g. the landing ViewContent — would be lost, because the tag
 *  scripts only load after the page is interactive. */
function send(fn: "fbq" | "gtag", q: "__abaPx" | "__abaGa", args: unknown[]) {
  const f = window[fn];
  if (f) { f(...args); return; }
  if (window[q] === null) return;                            // tag isn't configured
  (window[q] ??= []).push(args);
}

/** Meta click/browser ids from the parent's browser (never child data). */
export function metaBrowserIds(): { fbp?: string; fbc?: string } {
  try {
    const get = (n: string) => document.cookie.split("; ").find((c) => c.startsWith(n + "="))?.split("=")[1];
    return { fbp: get("_fbp"), fbc: get("_fbc") };
  } catch { return {}; }
}

export default function Analytics() {
  // Tags that aren't set up never load, so drop anything held for them.
  useEffect(() => {
    if (!PX) window.__abaPx = null;
    if (!GA) window.__abaGa = null;
  }, []);

  // Next.js moves between pages without a full reload, so the Pixel's own PageView only covers the first page.
  // Send one for every later page the visitor opens (GA4 tracks these on its own).
  const path = usePathname();
  const firstPath = useRef(path);
  useEffect(() => {
    if (path === firstPath.current) return;
    firstPath.current = "";
    try { window.fbq?.("track", "PageView"); } catch {}
  }, [path]);

  // Clarity records sessions, so keep it off the admin panel (student names, phones, payments).
  const clarity = CLARITY && !path?.startsWith("/admin");
  useEffect(() => {
    if (!CLARITY) return;
    try { (window as any).clarity?.(path?.startsWith("/admin") ? "stop" : "start"); } catch {}
  }, [path]);

  return (
    <>
      {clarity && (
        <Script id="ms-clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY}");
        `}</Script>
      )}
      {GA && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`
            window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
            window.gtag=gtag;gtag('js',new Date());gtag('config','${GA}',{anonymize_ip:true,allow_google_signals:false});
            (window.__abaGa||[]).forEach(function(a){gtag.apply(null,a)});window.__abaGa=null;
          `}</Script>
        </>
      )}
      {GTM && (
        <Script id="gtm" strategy="afterInteractive">{`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;
          f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM}');
        `}</Script>
      )}
      {PX && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {META_PIXEL_IDS.map((id) => <img key={id} height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`} />)}
        </noscript>
      )}
      {PX && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
          s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          ${META_PIXEL_IDS.map((id) => `fbq('init','${id}');`).join("")}fbq('track','PageView');
          (window.__abaPx||[]).forEach(function(a){fbq.apply(null,a)});window.__abaPx=null;
        `}</Script>
      )}
    </>
  );
}
