import Script from "next/script";

/*
 * Meta Pixel and Google tag (GA4 + Google Ads) for public marketing pages.
 * Each tag loads only when its ID is configured and passes a strict format
 * check, so IDs can never inject script. Not used on the authenticated app.
 */

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ?? "";
const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() ?? "";
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? "";

const pixelId = /^\d{5,20}$/.test(META_PIXEL_ID) ? META_PIXEL_ID : "";
const ga4Id = /^G-[A-Z0-9]{4,20}$/.test(GA4_ID) ? GA4_ID : "";
const adsId = /^AW-\d{5,20}$/.test(GOOGLE_ADS_ID) ? GOOGLE_ADS_ID : "";

export function MarketingTags() {
  const googleTagId = ga4Id || adsId;
  return (
    <>
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView');`}
        </Script>
      )}
      {googleTagId && (
        <>
          <Script
            id="google-tag-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
            strategy="afterInteractive"
          />
          <Script id="google-tag" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];
window.gtag=function(){window.dataLayer.push(arguments);};
gtag('js',new Date());
${ga4Id ? `gtag('config','${ga4Id}');` : ""}
${adsId ? `gtag('config','${adsId}',{allow_enhanced_conversions:true});` : ""}`}
          </Script>
        </>
      )}
    </>
  );
}
