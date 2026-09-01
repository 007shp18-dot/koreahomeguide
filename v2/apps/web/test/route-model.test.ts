import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import MarketOverviewPage, {
  generateStaticParams as generateMarketStaticParams,
} from '../app/[country]/[city]/page';
import IntentPage, {
  generateStaticParams as generateIntentStaticParams,
} from '../app/[country]/[city]/[intent]/page';
import ComparePage from '../app/compare/page';
import NotFound from '../app/not-found';
import { CapabilityGrid } from '../components/capability-grid';
import { ComparisonMatrix } from '../components/comparison-matrix';
import { MarketHero } from '../components/market-hero';
import { MarketLimitations } from '../components/market-limitations';
import {
  buildComparisonPageModel,
  buildIntentPageModel,
  buildMarketPageModel,
  intentRouteParams,
  marketRouteParams,
  type CapabilityGridModel,
  type ComparisonMatrixModel,
  type MarketHeroModel,
  type MarketLimitationsModel,
} from '../lib/route-model';

const expectedMarketParams = [
  { country: 'kr', city: 'seoul' },
  { country: 'sg', city: 'singapore' },
  { country: 'ae', city: 'dubai' },
] as const;

const expectedIntentParams = [
  { country: 'kr', city: 'seoul', intent: 'rent' },
  { country: 'kr', city: 'seoul', intent: 'buy' },
  { country: 'kr', city: 'seoul', intent: 'invest' },
  { country: 'sg', city: 'singapore', intent: 'rent' },
  { country: 'sg', city: 'singapore', intent: 'buy' },
  { country: 'sg', city: 'singapore', intent: 'invest' },
  { country: 'ae', city: 'dubai', intent: 'rent' },
  { country: 'ae', city: 'dubai', intent: 'buy' },
  { country: 'ae', city: 'dubai', intent: 'invest' },
] as const;

const expectedPublicThirdSegmentParams = [
  ...expectedIntentParams.slice(0, 3),
  ...SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => ({
    country: 'kr', city: 'seoul', intent: slug,
  })),
];

const unsupportedClaimPattern =
  /median|transaction count|guaranteed return|active partner marketplace|create account|sign[ -]?in|enquir|\b\d+(?:\.\d+)?%/i;

describe('market route model', () => {
  it('publishes exactly the three approved market overview contracts', () => {
    expect(marketRouteParams).toEqual(expectedMarketParams);
    expect(generateMarketStaticParams()).toEqual(expectedMarketParams.slice(0, 1));
    expect(
      marketRouteParams.map(({ country, city }) =>
        buildMarketPageModel(country, city)?.marketId,
      ),
    ).toEqual(['kr-seoul', 'sg-singapore', 'ae-dubai']);
  });

  it('publishes exactly nine approved intent contracts', () => {
    expect(intentRouteParams).toEqual(expectedIntentParams);
    expect(generateIntentStaticParams()).toEqual(expectedPublicThirdSegmentParams);
    expect(
      intentRouteParams.map(({ country, city, intent }) =>
        buildIntentPageModel(country, city, intent)?.href,
      ),
    ).toEqual([
      '/kr/seoul/rent/',
      '/kr/seoul/buy/',
      '/kr/seoul/invest/',
      '/sg/singapore/rent/',
      '/sg/singapore/buy/',
      '/sg/singapore/invest/',
      '/ae/dubai/rent/',
      '/ae/dubai/buy/',
      '/ae/dubai/invest/',
    ]);
  });

  it('builds Seoul as a full product with an explicit cross-brand Explorer action', () => {
    const model = buildMarketPageModel('kr', 'seoul');

    expect(model).toMatchObject({
      marketId: 'kr-seoul',
      productDepth: 'full_product',
      nativeCurrency: 'KRW',
      readiness: 'noindex',
      nextAction: {
        href: 'https://koreahomeguide.com/explore/',
        external: true,
      },
    });
    expect(model?.nextAction.label).toMatch(/KoreaHomeGuide.*Explorer/i);
    expect(JSON.stringify(model)).not.toMatch(unsupportedClaimPattern);
  });

  it('keeps Singapore private-sale intelligence limited and workflows blocked', () => {
    const model = buildMarketPageModel('sg', 'singapore');

    expect(model?.capabilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'URA private residential sale intelligence',
          state: 'limited',
          housingSector: 'private_residential',
        }),
        expect.objectContaining({
          label: 'Professional connection detail',
          state: 'rights_blocked',
          housingSector: null,
        }),
      ]),
    );
    expect(model?.capabilities).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: expect.stringMatching(/HDB/i) }),
      ]),
    );
  });

  it('keeps Dubai area and project posture separate from blocked detail', () => {
    const model = buildMarketPageModel('ae', 'dubai');

    expect(model?.capabilities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Area and project context',
          state: 'limited',
        }),
        expect.objectContaining({
          label: 'Transaction detail',
          state: 'rights_blocked',
        }),
        expect.objectContaining({
          label: 'Professional connection detail',
          state: 'rights_blocked',
        }),
      ]),
    );
  });

  it('rejects unknown country, city, locale, and intent model inputs', () => {
    expect(buildMarketPageModel('us', 'new-york')).toBeUndefined();
    expect(buildMarketPageModel('kr', 'dubai')).toBeUndefined();
    expect(buildMarketPageModel('ko', 'seoul')).toBeUndefined();
    expect(buildIntentPageModel('kr', 'seoul', 'sell')).toBeUndefined();
  });
});

describe('intent route model', () => {
  it('makes Seoul Rent Check the primary action for the Seoul rent intent only', () => {
    const seoulRent = buildIntentPageModel('kr', 'seoul', 'rent');

    expect(seoulRent?.overviewActions[0]).toMatchObject({
      label: 'Check a Seoul rent quote',
      href: '/kr/seoul/tools/rent-check/',
      external: false,
    });
    for (const params of expectedIntentParams.filter(
      ({ country, city, intent }) =>
        country !== 'kr' || city !== 'seoul' || intent !== 'rent',
    )) {
      expect(
        buildIntentPageModel(params.country, params.city, params.intent)?.overviewActions,
      ).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ href: '/kr/seoul/tools/rent-check/' }),
        ]),
      );
    }
  });

  it('gives every route a real comparison scope, usable source class, and blocked boundary', () => {
    for (const { country, city, intent } of expectedIntentParams) {
      const model = buildIntentPageModel(country, city, intent);

      expect(model?.comparisonScope.items.length).toBeGreaterThan(0);
      expect(
        model?.sourcePosture.items.some((item) => item.state !== 'rights_blocked'),
      ).toBe(true);
      expect(
        model?.sourcePosture.items.some((item) => item.state === 'rights_blocked'),
      ).toBe(true);
      expect(JSON.stringify(model)).not.toMatch(unsupportedClaimPattern);
    }
  });

  it('uses only release-gated private-sale evidence as a Singapore source class', () => {
    for (const intent of ['rent', 'buy', 'invest'] as const) {
      const model = buildIntentPageModel('sg', 'singapore', intent);
      const usableSources = model?.sourcePosture.items.filter(
        (item) => item.state !== 'rights_blocked',
      );

      expect(usableSources).toEqual([
        expect.objectContaining({
          label: 'URA private residential sale intelligence',
          housingSector: 'private_residential',
        }),
      ]);
      expect(JSON.stringify(usableSources)).not.toMatch(/HDB|rental/i);
    }
  });
});

describe('comparison route model', () => {
  it('uses the approved rows and status vocabulary without zero-filled values', () => {
    const model = buildComparisonPageModel();

    expect(model.readiness).toBe('noindex');
    expect(model.matrix.rows.map((row) => row.label)).toEqual([
      'Rent evidence',
      'Sale evidence',
      'Foreign-buyer rules',
      'Ownership costs',
      'Yield analysis',
      'Full local workflow',
    ]);
    expect(
      model.matrix.rows.flatMap((row) => row.cells.map((cell) => cell.state)),
    ).toEqual(
      expect.arrayContaining(['available', 'limited', 'rights_blocked']),
    );
    expect(JSON.stringify(model.matrix)).not.toMatch(
      /\b0(?:\.0+)?\b|zero data|no transactions = 0/i,
    );
  });

  it('separates Singapore private sales from rental and public-housing boundaries', () => {
    const model = buildComparisonPageModel();
    const singaporeCells = model.matrix.rows.map((row) =>
      row.cells.find((cell) => cell.marketId === 'sg-singapore'),
    );

    expect(model.matrix.sectorBoundary).toMatch(/private residential sales.*not combined.*rentals.*public housing/i);
    expect(singaporeCells.slice(0, 2)).toEqual([
      expect.objectContaining({ state: 'rights_blocked', description: expect.stringMatching(/^No Singapore rental/) }),
      expect.objectContaining({ state: 'limited', description: expect.stringMatching(/^URA private residential/) }),
    ]);
    expect(JSON.stringify(singaporeCells.slice(0, 2))).not.toMatch(
      /aggregate|blend|combined/i,
    );
  });
});

describe('real route rendering contracts', () => {
  it('contains generated routes while indexing only the comparison page', async () => {
    const marketModule = await import('../app/[country]/[city]/page');
    const intentModule = await import('../app/[country]/[city]/[intent]/page');
    const compareModule = await import('../app/compare/page');
    const notFoundModule = await import('../app/not-found');
    const generateMarketMetadata = Reflect.get(marketModule, 'generateMetadata') as (
      props: { params: Promise<{ country: string; city: string }> },
    ) => Promise<unknown>;
    const generateIntentMetadata = Reflect.get(intentModule, 'generateMetadata') as (
      props: { params: Promise<{ country: string; city: string; intent: string }> },
    ) => Promise<unknown>;

    expect(generateMarketMetadata).toEqual(expect.any(Function));
    expect(generateIntentMetadata).toEqual(expect.any(Function));

    const metadataByRoute = [
      await generateMarketMetadata({
        params: Promise.resolve({ country: 'kr', city: 'seoul' }),
      }),
      await generateIntentMetadata({
        params: Promise.resolve({ country: 'sg', city: 'singapore', intent: 'buy' }),
      }),
      Reflect.get(compareModule, 'metadata'),
      Reflect.get(notFoundModule, 'metadata'),
    ];

    expect(metadataByRoute).toEqual([
      {
        title: 'Seoul property intelligence | signedprice',
        description:
          'Review verified Seoul housing contract evidence, comparison tools and publication limits.',
        robots: { index: true, follow: true },
        alternates: {
          canonical: 'https://www.signedprice.com/kr/seoul/',
          languages: {
            en: 'https://www.signedprice.com/kr/seoul/',
            ko: 'https://www.signedprice.com/ko/kr/seoul/',
            'x-default': 'https://www.signedprice.com/kr/seoul/',
          },
        },
      },
      {
        title: 'Buy in Singapore | signedprice',
        description:
          'Review the Phase 1 buy comparison scope, source posture and data-rights limits for Singapore.',
        robots: { index: false, follow: true },
      },
      {
        title: 'Compare Seoul, Singapore and Dubai | signedprice',
        description:
          'Compare the Phase 1 capability and rights posture for rent, buy and invest decisions across Seoul, Singapore and Dubai.',
        robots: { index: true, follow: true },
        alternates: { canonical: 'https://www.signedprice.com/compare/' },
      },
      {
        title: 'Route not available | signedprice',
        description:
          'This signedprice Preview route is not available. Return to the approved market and comparison routes.',
        robots: { index: false, follow: false },
      },
    ]);
    expect(metadataByRoute.filter((metadata) => Reflect.has(metadata as object, 'alternates')))
      .toHaveLength(2);
  });

  it('renders all thirteen Task 4 routes from their static contracts', async () => {
    const routeMarkup: string[] = [];

    for (const params of expectedMarketParams) {
      routeMarkup.push(
        renderToStaticMarkup(await MarketOverviewPage({ params: Promise.resolve(params) })),
      );
    }

    for (const params of expectedIntentParams) {
      routeMarkup.push(
        renderToStaticMarkup(await IntentPage({ params: Promise.resolve(params) })),
      );
    }

    routeMarkup.push(renderToStaticMarkup(createElement(ComparePage)));

    expect(routeMarkup).toHaveLength(13);
    for (const markup of routeMarkup) {
      expect(markup).toContain('data-brand-wordmark="true"');
      expect(markup).toContain('href="/compare/"');
      expect(markup).not.toMatch(unsupportedClaimPattern);
      expect(markup).not.toMatch(/<form|<input|<button/i);
    }
  });

  it('throws the Next 404 boundary for unknown market and intent params', async () => {
    await expect(
      MarketOverviewPage({
        params: Promise.resolve({ country: 'kr', city: 'unknown' }),
      }),
    ).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' });
    await expect(
      IntentPage({
        params: Promise.resolve({ country: 'kr', city: 'seoul', intent: 'sell' }),
      }),
    ).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' });
  });

  it('renders the centralized custom not-found experience', () => {
    const markup = renderToStaticMarkup(createElement(NotFound));

    expect(markup).toContain('>This route is not available.</h1>');
    expect(markup).toContain('>Return to signedprice home</span>');
    expect(markup).toContain('aria-label="Market navigation"');
    expect(markup).not.toMatch(unsupportedClaimPattern);
  });
});

describe('locale-ready component contracts', () => {
  it('renders widened readonly models instead of component-owned English copy', () => {
    const hero = {
      sectionLabel: 'Résumé du marché',
      eyebrow: 'Marché local',
      heading: 'Ville exemple',
      description: 'Description localisée.',
      facts: [{ label: 'Devise', value: 'EUR' }],
    } as const satisfies MarketHeroModel;
    const grid = {
      sectionLabel: 'Capacités',
      eyebrow: 'Disponibilité',
      heading: 'Ce qui est publié',
      description: 'Limites localisées.',
      items: [
        {
          label: 'Données publiques',
          description: 'Source locale.',
          state: 'available',
          stateLabel: 'disponible',
          housingSector: null,
        },
      ],
    } as const satisfies CapabilityGridModel;
    const limitations = {
      sectionLabel: 'Limites',
      eyebrow: 'À savoir',
      heading: 'Limites actuelles',
      description: 'Description des limites.',
      items: ['Détail indisponible.'],
      actionsLabel: 'Étapes suivantes',
      actions: [
        {
          label: 'Retour',
          href: '/',
          description: 'Revenir au début.',
          external: false,
        },
      ],
    } as const satisfies MarketLimitationsModel;
    const matrix = {
      sectionLabel: 'Comparaison',
      eyebrow: 'Portée',
      heading: 'Comparer les marchés',
      description: 'Description comparée.',
      sectorBoundary: 'Les secteurs restent séparés.',
      tableLabel: 'Tableau comparatif',
      rowHeaderLabel: 'Capacité',
      columns: [{ marketId: 'kr-seoul', label: 'Séoul' }],
      rows: [
        {
          label: 'Preuves locatives',
          cells: [
            {
              marketId: 'kr-seoul',
              state: 'available',
              stateLabel: 'disponible',
              description: 'Contrats officiels.',
            },
          ],
        },
      ],
    } as const satisfies ComparisonMatrixModel;

    const markup = [
      renderToStaticMarkup(createElement(MarketHero, { model: hero })),
      renderToStaticMarkup(createElement(CapabilityGrid, { model: grid })),
      renderToStaticMarkup(createElement(MarketLimitations, { model: limitations })),
      renderToStaticMarkup(createElement(ComparisonMatrix, { model: matrix })),
    ].join('');

    expect(markup).toContain('Ville exemple');
    expect(markup).toContain('Données publiques');
    expect(markup).toContain('Détail indisponible.');
    expect(markup).toContain('aria-label="Retour"');
    expect(markup).toContain('Preuves locatives');
  });
});
