import { renderToStaticMarkup } from '../apps/web/node_modules/react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import SeoulContractCheckPage, {
  generateMetadata as englishPrimaryMetadata,
} from '../apps/web/app/(en)/kr/seoul/check/page';
import KoreanContractCheckPage, {
  generateMetadata as koreanPrimaryMetadata,
} from '../apps/web/app/(ko)/ko/kr/seoul/check/page';
import sitemap from '../apps/web/app/sitemap';
import { createPlaywrightConfig } from '../playwright.config';

afterEach(() => vi.unstubAllEnvs());

function installLocalReleaseEnvironment() {
  const config = createPlaywrightConfig({});
  if (config.webServer === undefined || Array.isArray(config.webServer)) {
    throw new Error('Expected one local release web server.');
  }
  for (const [key, value] of Object.entries(config.webServer.env ?? {})) {
    vi.stubEnv(key, String(value));
  }
}

describe('primary Check fixture isolation', () => {
  it('renders submitted English sale and Korean monthly quotes from dedicated evidence', async () => {
    installLocalReleaseEnvironment();
    const englishSale = renderToStaticMarkup(await SeoulContractCheckPage({
      searchParams: Promise.resolve({
        check: '1', district: 'gangnam-gu', housing: 'apartment', area: '84',
        transaction: 'sale', price: '1200000000',
      }),
    }));
    const koreanMonthly = renderToStaticMarkup(await KoreanContractCheckPage({
      searchParams: Promise.resolve({
        check: '1', district: 'gangnam-gu', housing: 'apartment', area: '84',
        transaction: 'monthly', deposit: '50000000', 'monthly-rent': '2000000',
      }),
    }));

    expect(englishSale).toContain('data-single-result');
    expect(englishSale).toContain('7 completed months · 2026-02–2026-08');
    expect(englishSale).not.toContain('Verified transaction evidence is unavailable.');
    expect(koreanMonthly).toContain('data-single-result');
    expect(koreanMonthly).toContain('7개월 완료 · 2026-02–2026-08');
    expect(koreanMonthly).not.toContain('Verified transaction evidence is unavailable.');
  });

  it('uses dedicated Check readiness for production metadata and sitemap', () => {
    installLocalReleaseEnvironment();
    vi.stubEnv('VERCEL_ENV', 'production');

    const englishMetadata = englishPrimaryMetadata();
    const koreanMetadata = koreanPrimaryMetadata();
    const urls = sitemap().map(({ url }) => url);

    expect(englishMetadata.robots).toEqual({ index: true, follow: true });
    expect(koreanMetadata.robots).toEqual({ index: true, follow: true });
    expect(englishMetadata.alternates?.canonical).toBe(
      'https://www.signedprice.com/kr/seoul/check/',
    );
    expect(koreanMetadata.alternates?.canonical).toBe(
      'https://www.signedprice.com/ko/kr/seoul/check/',
    );
    expect(urls).toContain('https://www.signedprice.com/kr/seoul/check/');
    expect(urls).toContain('https://www.signedprice.com/ko/kr/seoul/check/');
  });
});
