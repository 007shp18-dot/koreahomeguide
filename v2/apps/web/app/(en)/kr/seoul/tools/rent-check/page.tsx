import type { Metadata } from 'next';

import { RentCheckWorkspace } from '@/components/rent-check/rent-check-workspace';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import {
  DEFAULT_RENT_CHECK_INPUT,
  type RentCheckInput,
} from '@/lib/rent-check/client-state';
import { resolveExplorerRentCheckContext } from '@/lib/rent-check/explorer-context';
import { indexableMetadata } from '@/lib/public-metadata';
import type { SiteFooterModel, SiteHeaderModel } from '@/lib/site-copy';
import styles from '@/components/rent-check/rent-check.module.css';

type RentCheckPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = indexableMetadata({
  path: '/kr/seoul/tools/rent-check/',
  title: 'Seoul Rent Check | signedprice',
  description: 'Compare a Seoul rent quote with compatible official reported contracts.',
});

const header: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Rent Check navigation',
  links: [
    { label: 'Global home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'Rent Check', href: '/kr/seoul/tools/rent-check/', isCurrent: true },
  ],
};

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Property intelligence for Seoul, Singapore and Dubai.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'Seoul Explorer', href: '/kr/seoul/explore/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: 'Market reference only. Not an appraisal, legal opinion or financial recommendation.',
};

export default async function RentCheckPage({ searchParams }: RentCheckPageProps) {
  const explorerContext = resolveExplorerRentCheckContext(await searchParams);
  const initialInput: RentCheckInput = explorerContext ? {
    ...DEFAULT_RENT_CHECK_INPUT,
    lawdCd: explorerContext.lawdCd,
    housingType: explorerContext.housingType,
  } : DEFAULT_RENT_CHECK_INPUT;

  return (
    <div id="top" className={styles['rent-check-page']}>
      <SiteHeader copy={header} />
      <main>
        <header className={styles['market-header']}>
          <p>Seoul · Official rent evidence</p>
          <h1>Check the quote against reported contracts.</h1>
          <p>
            Compare a monthly-rent or jeonse quote with compatible official contracts.
            Asking values and reported evidence remain clearly separated.
          </p>
        </header>
        <RentCheckWorkspace initialInput={initialInput} explorerContext={explorerContext} />
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
