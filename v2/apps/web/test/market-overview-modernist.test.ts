import { readFileSync, statSync } from 'node:fs';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import MarketOverviewPage from '../app/[country]/[city]/page';
import IntentPage from '../app/[country]/[city]/[intent]/page';
import { buildMarketPageModel, marketRouteParams } from '../lib/route-model';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

const expectedRows = [
  'Current product depth',
  'Available evidence',
  'Supported decisions',
  'Known limitations',
  'Local rules and costs',
  'Source and methodology status',
] as const;

function declarationsFor(source: string, selector: string): Record<string, string> {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = source.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  if (!rule?.[1]) throw new Error(`Missing CSS rule ${selector}`);

  return Object.fromEntries(
    rule[1]
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const separator = declaration.indexOf(':');
        return [
          declaration.slice(0, separator).trim(),
          declaration.slice(separator + 1).trim(),
        ];
      }),
  );
}

function cssBetween(start: string, end: string): string {
  const startIndex = css.indexOf(start);
  const endIndex = css.indexOf(end, startIndex + start.length);
  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Missing CSS range ${start} ... ${end}`);
  }
  return css.slice(startIndex, endIndex);
}

describe('shared status label vocabulary', () => {
  it('renders all four named states through one shared component', async () => {
    const modulePath = '../components/status-label';
    const statusModule = await import(modulePath);
    const StatusLabel = Reflect.get(statusModule, 'StatusLabel') as ComponentType<{
      state: 'available' | 'limited' | 'rights_blocked' | 'not_built';
      label: string;
    }>;

    const markup = renderToStaticMarkup(
      createElement(
        'div',
        null,
        createElement(StatusLabel, { state: 'available', label: 'Available' }),
        createElement(StatusLabel, { state: 'limited', label: 'Limited' }),
        createElement(StatusLabel, {
          state: 'rights_blocked',
          label: 'Rights blocked',
        }),
        createElement(StatusLabel, { state: 'not_built', label: 'Not built' }),
      ),
    );

    expect(markup.match(/class="status-label status-label--/g)).toHaveLength(4);
    expect(markup).toContain('data-state="available">Available</span>');
    expect(markup).toContain('data-state="limited">Limited</span>');
    expect(markup).toContain('data-state="rights_blocked">Rights blocked</span>');
    expect(markup).toContain('data-state="not_built">Not built</span>');
  });

  it('distinguishes fill, two-pixel outline, hatch and hairline without color alone', () => {
    expect(declarationsFor(css, '.status-label--available')).toMatchObject({
      background: 'var(--ink)',
      color: 'var(--canvas)',
    });
    expect(declarationsFor(css, '.status-label--limited')).toMatchObject({
      border: '2px solid var(--ink)',
    });
    expect(declarationsFor(css, '.status-label--rights_blocked')[
      'background-image'
    ]).toMatch(/repeating-linear-gradient\(-45deg/);
    expect(declarationsFor(css, '.status-label--not_built')).toMatchObject({
      border: '1px solid var(--divider)',
    });
  });
});

describe('three market overview routes', () => {
  it('builds the same ordered six-row information hierarchy for every market', () => {
    expect(marketRouteParams).toHaveLength(3);

    for (const { country, city } of marketRouteParams) {
      const model = buildMarketPageModel(country, city);
      const rows = Reflect.get(model ?? {}, 'overviewRows') as
        | readonly { number: string; title: string }[]
        | undefined;

      expect(rows?.map((row) => row.number)).toEqual([
        '01',
        '02',
        '03',
        '04',
        '05',
        '06',
      ]);
      expect(rows?.map((row) => row.title)).toEqual(expectedRows);
    }
  });

  it('renders six connected rows in model order on all market pages', async () => {
    for (const params of marketRouteParams) {
      const markup = renderToStaticMarkup(
        await MarketOverviewPage({ params: Promise.resolve(params) }),
      );

      expect(markup.match(/class="market-overview-row"/g)).toHaveLength(6);
      let previousIndex = -1;
      for (const title of expectedRows) {
        const index = markup.indexOf(`>${title}<`);
        expect(index).toBeGreaterThan(previousIndex);
        previousIndex = index;
      }
    }
  });

  it('uses the shared four-link product navigation on market overviews', async () => {
    for (const params of marketRouteParams) {
      const markup = renderToStaticMarkup(
        await MarketOverviewPage({ params: Promise.resolve(params) }),
      );
      const navigation = markup.match(
        /<nav aria-label="Primary navigation">([\s\S]*?)<\/nav>/,
      )?.[1] ?? '';

      expect(navigation.match(/<a /g) ?? []).toHaveLength(4);
      for (const label of ['Check', 'Explore', 'Briefs', 'Guide']) {
        expect(navigation).toContain(`>${label}</a>`);
      }
    }
  });

  it('leaves the shared product links inactive on generic intent routes', async () => {
    const markup = renderToStaticMarkup(
      await IntentPage({
        params: Promise.resolve({ country: 'kr', city: 'seoul', intent: 'rent' }),
      }),
    );
    const navigation = markup.match(
      /<nav aria-label="Primary navigation">([\s\S]*?)<\/nav>/,
    )?.[1] ?? '';

    expect(navigation.match(/<a /g) ?? []).toHaveLength(4);
    expect(navigation).toContain('>Check</a>');
    expect(navigation).not.toContain('aria-current');
  });

  it('keeps evidence separate from operating capabilities and aggregates mixed rights deny-safe', () => {
    const seoulEvidence = buildMarketPageModel('kr', 'seoul')?.overviewRows[1];
    const singaporeEvidence = buildMarketPageModel('sg', 'singapore')?.overviewRows[1];
    const dubaiEvidence = buildMarketPageModel('ae', 'dubai')?.overviewRows[1];

    expect(seoulEvidence).toMatchObject({ title: 'Available evidence', state: 'available' });
    expect(singaporeEvidence).toMatchObject({
      title: 'Available evidence',
      state: 'limited',
    });
    expect(dubaiEvidence).toMatchObject({ title: 'Available evidence', state: 'limited' });

    for (const evidence of [seoulEvidence, singaporeEvidence, dubaiEvidence]) {
      expect(evidence?.items.map((item) => item.label).join(' ')).not.toMatch(
        /professional connection|live rent exploration/i,
      );
    }
  });

  it('renders the tier in a full-bleed hero and ends with one connected action group', async () => {
    for (const params of marketRouteParams) {
      const markup = renderToStaticMarkup(
        await MarketOverviewPage({ params: Promise.resolve(params) }),
      );

      expect(markup).toContain('class="market-hero market-hero--overview site-shell"');
      expect(markup).toContain('data-product-intro="true"');
      expect(markup).toContain('class="market-hero__tier"');
      expect(markup).not.toContain('class="market-hero__facts"');
      expect(markup).not.toContain('<section class="market-limitations');
      expect(markup.match(/class="market-overview-action /g)).toHaveLength(2);
      expect(markup.match(/class="market-overview-actions market-limitations__actions"/g))
        .toHaveLength(1);
    }
  });
});

describe('market overview Modernist and responsive contracts', () => {
  it('uses square, connected rows with two-pixel structural rules', () => {
    expect(declarationsFor(css, '.market-overview.site-shell')).toMatchObject({
      width: '100%',
      'max-width': 'none',
      margin: '0',
      padding: '0',
    });
    expect(declarationsFor(css, '.market-overview-rows')).toMatchObject({
      'border-bottom': '2px solid var(--ink)',
      'border-radius': '0',
    });
    expect(declarationsFor(css, '.market-hero--overview.site-shell')).toMatchObject({
      width: '100%',
      'max-width': 'none',
      margin: '0',
      'border-bottom': '2px solid var(--ink)',
    });
    expect(declarationsFor(css, '.market-overview-row')).toMatchObject({
      display: 'grid',
      'grid-template-columns': 'minmax(180px, 240px) minmax(0, 1fr)',
      'border-bottom': '1px solid var(--line)',
    });
    expect(declarationsFor(css, '.market-overview-row__label')).toMatchObject({
      'border-right': '2px solid var(--ink)',
    });
    expect(declarationsFor(css, '.market-overview-row__number')).toMatchObject({
      'margin-bottom': '7px',
    });
  });

  it('gives connected actions a local high-contrast inset focus treatment', () => {
    expect(declarationsFor(css, '.market-overview-action:focus-visible')).toMatchObject({
      outline: '2px solid var(--ink)',
      'outline-offset': '-4px',
      'box-shadow': 'inset 0 0 0 2px var(--canvas)',
    });
    expect(
      declarationsFor(css, '.market-overview-action--primary:focus-visible'),
    ).toMatchObject({
      'outline-color': 'var(--canvas)',
      'box-shadow': 'inset 0 0 0 2px var(--canvas)',
    });
  });

  it('collapses rows to one column on mobile without page-level overflow', () => {
    const mobileCss = cssBetween(
      '@media (max-width: 640px)',
      '@media (prefers-reduced-motion: reduce)',
    );

    expect(declarationsFor(mobileCss, '.market-overview-row')).toMatchObject({
      'grid-template-columns': '1fr',
    });
    expect(declarationsFor(mobileCss, '.market-overview-row__label')).toMatchObject({
      'border-right': '0',
      'border-bottom': '2px solid var(--ink)',
    });
    expect(declarationsFor(mobileCss, '.market-overview-row__number')).toMatchObject({
      'margin-bottom': '7px',
    });
    expect(declarationsFor(css, 'body')['overflow-x']).toMatch(/^(clip|hidden)$/);
    expect(mobileCss).not.toMatch(/overflow-x:\s*(auto|scroll)/);
  });
});

describe('bundled Archivo and pre-launch route safety', () => {
  it('serves a real local Archivo WOFF2 asset through the authored font face', () => {
    const fontUrl = new URL('../public/fonts/archivo-latin-wght-normal.woff2', import.meta.url);
    const font = readFileSync(fontUrl);

    expect(statSync(fontUrl).size).toBeGreaterThan(30_000);
    expect(font.subarray(0, 4).toString('ascii')).toBe('wOF2');
    expect(css).toMatch(
      /@font-face\s*{[\s\S]*?font-family:\s*"Archivo"[\s\S]*?url\("\/fonts\/archivo-latin-wght-normal\.woff2"\) format\("woff2"\)[\s\S]*?font-weight:\s*100 900/,
    );
    expect(css).not.toMatch(/fonts\.(googleapis|gstatic)\.com/i);
  });

  it('keeps the shared shell SEO-neutral while generated market routes stay contained', async () => {
    const layoutModule = await import('../app/layout');
    const intentModule = await import('../app/[country]/[city]/[intent]/page');

    expect(marketRouteParams).toEqual([
      { country: 'kr', city: 'seoul' },
      { country: 'sg', city: 'singapore' },
      { country: 'ae', city: 'dubai' },
    ]);
    expect(intentModule.generateStaticParams()).toEqual([
      { country: 'kr', city: 'seoul', intent: 'rent' },
      { country: 'kr', city: 'seoul', intent: 'buy' },
      { country: 'kr', city: 'seoul', intent: 'invest' },
      ...SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => ({
        country: 'kr', city: 'seoul', intent: slug,
      })),
    ]);
    expect(layoutModule.metadata).not.toHaveProperty('robots');
    expect(layoutModule.metadata).not.toHaveProperty('alternates');
  });
});
