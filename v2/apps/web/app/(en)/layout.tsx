import type { Metadata } from "next";
import type { ReactNode } from "react";
import { preload } from "react-dom";
import { Analytics } from "@vercel/analytics/next";
import { AdvertisingConsent } from "@/components/consent/advertising-consent";
import { PublicSiteJsonLd } from "@/components/public-json-ld";
import { advertisingConfigFromEnvironment } from "@/lib/advertising/advertising-config.server";
import { analyticsConfigFromEnvironment } from "@/lib/analytics/analytics-config.server";
import { homepageCopy } from "@/lib/site-copy";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.signedprice.com'),
  title: homepageCopy.metadata.title,
  description: homepageCopy.metadata.description,
};

export default function EnglishRootLayout({ children }: { children: ReactNode }) {
  const analytics = analyticsConfigFromEnvironment();
  const advertising = advertisingConfigFromEnvironment();
  preload("/fonts/archivo-latin-wght-normal.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    <html lang="en">
      <body>
        {children}
        <PublicSiteJsonLd />
        {analytics.status === "ready" || advertising.status === "ready" ? (
          <AdvertisingConsent
            {...(analytics.status === "ready"
              ? { analyticsMeasurementId: analytics.measurementId }
              : {})}
            {...(advertising.status === "ready"
              ? { publisherId: advertising.publisherId }
              : {})}
          />
        ) : null}
        <Analytics />
      </body>
    </html>
  );
}
