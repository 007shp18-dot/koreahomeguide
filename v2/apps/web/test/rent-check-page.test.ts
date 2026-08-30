import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RentCheckForm } from '../components/rent-check/rent-check-form';
import { revealRentCheckResult } from '../components/rent-check/rent-check-workspace';
import { createInitialRentCheckState } from '../lib/rent-check/client-state';
import { resolveExplorerRentCheckContext } from '../lib/rent-check/explorer-context';

type RentCheckPageModule = {
  default: (props: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }) => Promise<unknown> | unknown;
  metadata: Record<string, unknown>;
};

async function loadPage(): Promise<RentCheckPageModule> {
  return import('../app/kr/seoul/tools/rent-check/page') as Promise<RentCheckPageModule>;
}

const css = readFileSync(
  new URL('../app/kr/seoul/tools/rent-check/rent-check.module.css', import.meta.url),
  'utf8',
);

describe('Seoul Rent Check page shell', () => {
  it('is linked from the Seoul rent overview with the authored quote-check action', async () => {
    const { default: IntentPage } = await import('../app/[country]/[city]/[intent]/page');
    const markup = renderToStaticMarkup(await IntentPage({
      params: Promise.resolve({ country: 'kr', city: 'seoul', intent: 'rent' }),
    }) as never);

    expect(markup).toContain(
      'href="/kr/seoul/tools/rent-check/"',
    );
    expect(markup).toContain('>Check a Seoul rent quote</strong>');
  });

  it('renders one H1 and a connected quote-to-evidence workspace', async () => {
    const { default: Page } = await loadPage();
    const markup = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }) as never);

    expect(markup.match(/<h1(?:\s|>)/g)).toHaveLength(1);
    expect(markup).toContain('Check the quote against reported contracts.');
    expect(markup).toMatch(/>01<\/span><h2[^>]*>Quote<\/h2>/);
    expect(markup).toMatch(/>02<\/span><h2[^>]*>Market evidence<\/h2>/);
    expect(markup).toMatch(/>03<\/span><h2[^>]*>Comparable contracts<\/h2>/);
    expect(markup).toContain('id="rent-check-result"');
    expect(markup).toContain('data-result-state="idle"');
    expect(markup).not.toContain('aria-live="polite"');
  });

  it('uses persistent native labels, a fieldset and a legend for all inputs', async () => {
    const { default: Page } = await loadPage();
    const markup = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }) as never);

    for (const id of ['rent-area', 'rent-size', 'rent-deposit', 'rent-monthly']) {
      expect(markup).toContain(`for="${id}"`);
      expect(markup).toContain(`id="${id}"`);
    }
    expect(markup).toContain('<fieldset');
    expect(markup).toContain('<legend>Housing type</legend>');
    expect(markup.match(/name="housingType"/g)).toHaveLength(5);
    expect(markup).toContain('aria-describedby="housing-type-help"');
    expect(markup).toMatch(/<form[^>]* noValidate=""/);
    expect(markup).toContain('role="group" aria-label="Area unit"');
  });

  it('offers all 25 verified districts without displaying a raw code as its label', async () => {
    const { default: Page } = await loadPage();
    const markup = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }) as never);
    const select = markup.match(/<select[^>]*id="rent-area"[\s\S]*?<\/select>/)?.[0] ?? '';

    expect(select.match(/<option /g)).toHaveLength(25);
    expect(select).toContain('>Jongno-gu (종로구)</option>');
    expect(select).toContain('>Gangnam-gu (강남구)</option>');
    expect(select).not.toMatch(/>\s*11\d{3}\s*</);
  });

  it.each([
    ['apartment', ['35', '60', '85']],
    ['officetel', ['15', '20', '30']],
    ['villa', ['20', '35', '60']],
    ['detached', ['20', '35', '50']],
    ['studio', ['15', '20', '25']],
  ] as const)('renders only the %s size presets', (housingType, expected) => {
    const state = createInitialRentCheckState({
      lawdCd: '11590', housingType, areaSqm: '', areaUnit: 'sqm',
      depositWon: '', monthlyRentWon: '',
    });
    const markup = renderToStaticMarkup(createElement(RentCheckForm, {
      state,
      dispatch: () => undefined,
      onSubmit: () => undefined,
    }));
    const presets = [...markup.matchAll(/data-size-preset="([0-9]+)"/g)].map(
      (match) => match[1],
    );

    expect(presets).toEqual(expected);
  });

  it('states the exact method assumption without presenting it as a legal rate', async () => {
    const { default: Page } = await loadPage();
    const markup = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }) as never);

    expect(markup).toContain('5.0%/year signedprice comparison assumption');
    expect(markup).not.toMatch(/statutory|legal rate|guaranteed|market-mandated/i);
  });
});

describe('route metadata and authored head contract', () => {
  it('keeps route metadata on the Server Component without canonical, hreflang or robots override', async () => {
    const page = await loadPage();
    const source = readFileSync(
      new URL('../app/kr/seoul/tools/rent-check/page.tsx', import.meta.url),
      'utf8',
    );

    expect(source).not.toMatch(/^\s*['"]use client['"]/m);
    expect(page.metadata).toEqual({
      title: 'Seoul Rent Check | signedprice',
      description: 'Compare a Seoul rent quote with compatible official reported contracts.',
    });
    expect(page.metadata).not.toHaveProperty('robots');
    expect(page.metadata).not.toHaveProperty('alternates');
    expect(JSON.stringify(page.metadata)).not.toMatch(/canonical|languages|hreflang/i);
  });

  it('resolves the built head boundary to inherited noindex, follow and no alternates', async () => {
    const root = await import('../app/layout');
    const page = await loadPage();
    const resolved = { ...root.metadata, ...page.metadata } as {
      robots?: { index?: boolean; follow?: boolean };
      alternates?: unknown;
    };
    const head = renderToStaticMarkup(createElement('head', null,
      createElement('meta', {
        name: 'robots',
        content: `${resolved.robots?.index ? 'index' : 'noindex'}, ${resolved.robots?.follow ? 'follow' : 'nofollow'}`,
      }),
    ));

    expect(head).toContain('<meta name="robots" content="noindex, follow"/>');
    expect(resolved).not.toHaveProperty('alternates');
    expect(head).not.toMatch(/canonical|hreflang|rel="alternate"/i);
  });
});

describe('Modernist responsive form contract', () => {
  it('authors square 52px controls with a visible two-pixel focus', () => {
    expect(css).toMatch(/\.primary-control\s*\{[\s\S]*?min-height:\s*52px;/);
    expect(css).toMatch(/\.primary-control\s*\{[\s\S]*?border-radius:\s*0;/);
    expect(css).toMatch(/:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--focus-ring\);/);
    expect(css).not.toMatch(/box-shadow:\s*(?!none)/);
  });

  it('uses the approved desktop columns, intermediate stack and mobile one-column flow', () => {
    expect(css).toMatch(
      /@media\s*\(min-width:\s*1180px\)[\s\S]*?grid-template-columns:\s*minmax\(720px,\s*3fr\)\s+minmax\(360px,\s*2fr\);/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*?\.form-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
    );
    expect(css).toMatch(/min-width:\s*0;/);
    expect(css).toMatch(/width:\s*min\(1440px,\s*100%\);/);
    expect(css).not.toMatch(/overflow-x:\s*(auto|scroll)/);
  });

  it('keeps every housing and unit target at least 44px wide without 720px overflow', () => {
    expect(css).toMatch(/\.unit-toggle button[\s\S]*?min-inline-size:\s*44px;/);
    expect(css).toMatch(/\.housing-choice\s*\{[\s\S]*?min-inline-size:\s*44px;/);
    expect(css).toMatch(/\.housing-choice\s*\{[\s\S]*?min-height:\s*48px;/);
    expect(css).toMatch(
      /\.housing-choices\s*\{[\s\S]*?grid-template-columns:\s*repeat\(5,\s*minmax\(44px,\s*1fr\)\);/,
    );

    const quotePanelRightBorder = 2;
    const authoredHorizontalPadding = 11 * 2;
    const authoredColumnGaps = 12 * 2;
    const housingInlineBorders = 2 * 2;
    for (const quoteWidth of [720, 721, 755]) {
      const housingTrackContentWidth = (
        quoteWidth - quotePanelRightBorder - authoredHorizontalPadding - authoredColumnGaps
      ) / 3 - housingInlineBorders;
      expect(housingTrackContentWidth / 5).toBeGreaterThanOrEqual(44);
    }
    expect(css).toMatch(/\.form-grid\s*\{[\s\S]*?padding:\s*12px 11px;[\s\S]*?gap:\s*12px;/);
  });

  it('authors visible result focus and reduced-motion-aware scrolling', async () => {
    const workspaceSource = readFileSync(
      new URL('../components/rent-check/rent-check-workspace.tsx', import.meta.url),
      'utf8',
    );

    expect(workspaceSource).toContain('scrollIntoView');
    expect(workspaceSource).toContain('prefers-reduced-motion: reduce');
    expect(css).toMatch(/\.result-slot h2:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--focus-ring\);/);
    expect(css).not.toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.rent-check-page\s*\{[\s\S]*?scroll-behavior/,
    );
  });

  it.each([false, true])(
    'reveals a completed result with %s reduced-motion preference',
    (reducedMotion) => {
      const calls: unknown[] = [];
      const target = {
        focus: (options: unknown) => calls.push(['focus', options]),
        scrollIntoView: (options: unknown) => calls.push(['scroll', options]),
      };

      revealRentCheckResult(target, reducedMotion);
      expect(calls).toEqual([
        ['focus', { preventScroll: true }],
        ['scroll', { behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }],
      ]);
    },
  );
});

describe('verified Explorer context resolver', () => {
  it('returns only labels looked up through the complete registry relationship', () => {
    expect(resolveExplorerRentCheckContext({
      lawdCd: '11590',
      type: 'officetel',
      dong: 'noryangjin-dong',
      building: 'noryangjin-dream-square',
    })).toEqual({
      lawdCd: '11590',
      districtLabel: 'Dongjak-gu (동작구)',
      housingType: 'officetel',
      housingTypeLabel: 'Officetel',
      neighborhoodId: 'noryangjin-dong',
      neighborhoodLabel: 'Noryangjin-dong (노량진동)',
      buildingId: 'noryangjin-dream-square',
      buildingLabel: 'Noryangjin Dream Square Complex (노량진 드림스퀘어 복합빌딩)',
    });
  });

  it.each([
    { lawdCd: '11590', type: 'officetel', dong: 'unknown', building: '<b>Raw</b>' },
    { lawdCd: '11680', type: 'officetel', dong: 'noryangjin-dong', building: 'noryangjin-dream-square' },
    { lawdCd: ['11590', '<img src=x>'], type: 'officetel' },
    { lawdCd: '11590', type: '<script>alert(1)</script>' },
  ])('ignores unknown, orphan, repeated or raw HTML context %#', (query) => {
    expect(resolveExplorerRentCheckContext(query)).toBeNull();
  });
});
