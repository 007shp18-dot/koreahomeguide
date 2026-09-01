import { AdvertisingConsent } from '@/components/consent/advertising-consent';
import { PublicSiteJsonLd } from '@/components/public-json-ld';
import { advertisingConfigFromEnvironment } from '@/lib/advertising/advertising-config.server';
import { homepageCopy } from '@/lib/site-copy';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { preload } from 'react-dom';

import '../globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.signedprice.com'),
  title: homepageCopy.metadata.title,
  description: homepageCopy.metadata.description,
};

export default function KoreanRootLayout({ children }: { children: ReactNode }) {
  const advertising = advertisingConfigFromEnvironment();
  preload('/fonts/archivo-latin-wght-normal.woff2', {
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  });

  return (
    <html lang="ko">
      <body>
        {children}
        <PublicSiteJsonLd />
        {advertising.status === 'ready' ? (
          <AdvertisingConsent publisherId={advertising.publisherId} />
        ) : null}
      </body>
    </html>
  );
}
