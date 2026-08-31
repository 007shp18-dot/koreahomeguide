import { createCorrectionLedger } from '@signedprice/market-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import TrustPage, { metadata as trustMetadata } from '../app/trust/page';
import KoreaCorrectionsPage, {
  metadata as koreaCorrectionsMetadata,
} from '../app/kr/seoul/corrections/page';
import ExplorerPage from '../app/kr/seoul/explore/page';
import RankingsPage from '../app/kr/seoul/rankings/page';
import Home from '../app/page';
import sitemap from '../app/sitemap';
import {
  listCorrections,
} from '../lib/trust/correction-ledgers.server';

afterEach(() => vi.unstubAllEnvs());

describe('correction ledger repository', () => {
  it('keeps the Production ledger empty and immutable', () => {
    const corrections = listCorrections('kr-seoul');

    expect(corrections).toEqual([]);
    expect(Object.isFrozen(corrections)).toBe(true);
  });

  it('filters a validated ledger by market and optional scope', () => {
    const source = createCorrectionLedger([
      {
        id: 'kr-district', date: '2026-08-30', marketId: 'kr-seoul',
        scope: 'district-summary', status: 'FIXED', raisedBy: 'INTERNAL',
        summary: 'Corrected a district display label.',
      },
      {
        id: 'kr-check', date: '2026-08-29', marketId: 'kr-seoul',
        scope: 'contract-check', status: 'UPHELD', raisedBy: 'USER',
        summary: 'Reviewed the conversion method and retained the result.',
      },
      {
        id: 'sg-project', date: '2026-08-28', marketId: 'sg-singapore',
        scope: 'project-summary', status: 'UPHELD', raisedBy: 'USER',
        summary: 'Reviewed a project record and retained the source value.',
      },
    ]);

    expect(listCorrections('kr-seoul', undefined, source).map(({ id }) => id)).toEqual([
      'kr-district',
      'kr-check',
    ]);
    expect(listCorrections('kr-seoul', 'contract-check', source).map(({ id }) => id))
      .toEqual(['kr-check']);
    expect(listCorrections('kr-seoul', 'project-summary', source)).toEqual([]);
  });
});

describe('Trust routes', () => {
  it('renders global evidence policy without unsupported accuracy claims', () => {
    const html = renderToStaticMarkup(<TrustPage />);

    for (const visible of [
      'How SignedPrice publishes evidence',
      'Evidence states',
      'Freshness',
      'Rights',
      'Corrections',
      'Accuracy',
      'No model-accuracy figure is currently published',
    ]) {
      expect(html).toContain(visible);
    }
    expect(html).not.toMatch(/191,067|8\.2%|most accurate|guaranteed/i);
  });

  it('renders an honest empty Korea correction route', () => {
    const html = renderToStaticMarkup(<KoreaCorrectionsPage />);

    expect(html).toContain('Seoul evidence corrections');
    expect(html).toContain('No published corrections');
    expect(html).toContain('href="/kr/seoul/explore"');
    expect(html).toContain('href="/kr/seoul/rankings"');
    expect(html).not.toContain('<ol>');
    expect(html).not.toContain('A display label was corrected.');
  });

  it('indexes Global Trust and keeps the correction ledger contained', () => {
    expect(trustMetadata.robots).toEqual({ index: true, follow: true });
    expect(trustMetadata.alternates).toEqual({
      canonical: 'https://www.signedprice.com/trust/',
    });
    expect(koreaCorrectionsMetadata.robots).toEqual({ index: false, follow: true });
    expect(koreaCorrectionsMetadata).not.toHaveProperty('alternates');
    const urls = sitemap().map(({ url }) => url);
    expect(urls).toContain('https://www.signedprice.com/trust/');
    expect(urls).not.toContain('https://www.signedprice.com/kr/seoul/corrections/');
  });

  it('links global and Korea evidence surfaces to the correct Trust routes', async () => {
    const home = renderToStaticMarkup(await Home());
    const explore = renderToStaticMarkup(await ExplorerPage({
      searchParams: Promise.resolve({}),
    }));
    const rankings = renderToStaticMarkup(<RankingsPage />);

    expect(home).toContain('href="/trust/"');
    for (const html of [explore, rankings]) {
      expect(html).toContain('href="/trust/"');
      expect(html).toContain('href="/kr/seoul/corrections/"');
    }
  });
});
