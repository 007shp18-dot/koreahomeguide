import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createExplorerRentCheckHref } from '../components/explorer-workspace';
import { intentRouteParams, marketRouteParams } from '../lib/route-model';
import {
  PUBLIC_AREA_FIXTURE_PERIOD,
  createPublicAreaFixture,
} from './public-area-fixture';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

type ExplorerPageModule = {
  default: (props: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }) => Promise<unknown> | unknown;
  metadata: {
    robots: {
      index: boolean;
      follow: boolean;
    };
  };
};

type BuildingDialogModule = {
  BuildingDialog: (props: Record<string, unknown>) => unknown;
};

async function loadExplorerPage(): Promise<ExplorerPageModule> {
  const modulePath = '../app/kr/seoul/explore/page';
  return import(/* @vite-ignore */ modulePath) as Promise<ExplorerPageModule>;
}

async function loadBuildingDialog(): Promise<BuildingDialogModule> {
  const modulePath = '../components/building-dialog';
  return import(/* @vite-ignore */ modulePath) as Promise<BuildingDialogModule>;
}

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

const buildingWithMissingEvidence = {
  id: 'noryangjin-dream-square',
  nameKo: '노량진 드림스퀘어 복합빌딩',
  nameEn: 'Noryangjin Dream Square Complex',
  streetView: {
    label: 'Street view near this building',
    disclaimer: 'Street View shows the nearby street, not a listing photo.',
  },
  evidence: {
    depositWon: null,
    monthlyRentWon: null,
    adjustedPerSqmWon: null,
    contractCount: null,
  },
};

const verifiedRentCheckHref =
  '/kr/seoul/tools/rent-check/?lawdCd=11590&type=officetel&dong=noryangjin-dong&building=noryangjin-dream-square';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('/kr/seoul/explore/ route contract', () => {
  it('renders the indexable Seoul district evidence map and complete table', async () => {
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicAreaFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);
    const { default: ExplorerPage, metadata } = await loadExplorerPage();
    const page = await ExplorerPage({
      searchParams: Promise.resolve({ district: 'dongjak-gu' }),
    });
    const markup = renderToStaticMarkup(page as never);

    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(Reflect.get(metadata, 'alternates')).toEqual({
      canonical: 'https://www.signedprice.com/kr/seoul/explore/',
    });
    expect(markup).toContain('Selected · Dongjak-gu');
    expect(markup).toContain('role="img"');
    expect(markup).toContain('viewBox="0 0 720 560"');
    expect((markup.match(/data-district-path=/g) ?? [])).toHaveLength(25);
    expect((markup.match(/data-district-row=/g) ?? [])).toHaveLength(25);
    expect(markup).not.toMatch(/data-discovery-step|Search this area|Interact with map/);
  });

  it('is a separate route without widening the approved market and intent route registries', async () => {
    const route = await loadExplorerPage();

    expect(route.default).toBeTypeOf('function');
    expect(marketRouteParams).toHaveLength(3);
    expect(intentRouteParams).toHaveLength(9);
    expect(JSON.stringify([marketRouteParams, intentRouteParams])).not.toContain(
      'explore',
    );
  });

  it.each([
    {
      name: 'wrong district',
      query: {
        lawdCd: '11680',
        type: 'officetel',
        dong: 'noryangjin-dong',
        building: 'noryangjin-dream-square',
      },
    },
    {
      name: 'repeated complete context',
      query: {
        lawdCd: ['11590', '11680'],
        type: ['officetel', 'studio'],
        dong: ['noryangjin-dong', 'sindaebang-dong'],
        building: ['noryangjin-dream-square', 'megastudy-tower'],
      },
    },
    {
      name: 'missing district',
      query: {
        type: 'officetel',
        dong: 'noryangjin-dong',
        building: 'noryangjin-dream-square',
      },
    },
    {
      name: 'missing property type',
      query: {
        lawdCd: '11590',
        dong: 'noryangjin-dong',
        building: 'noryangjin-dream-square',
      },
    },
    {
      name: 'wrong dong-building relationship',
      query: {
        lawdCd: '11590',
        type: 'officetel',
        dong: 'sindaebang-dong',
        building: 'noryangjin-dream-square',
      },
    },
  ])('ignores legacy discovery context for $name', async ({ query }) => {
    vi.stubEnv(
      'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
      JSON.stringify(createPublicAreaFixture()),
    );
    vi.stubEnv('SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD', PUBLIC_AREA_FIXTURE_PERIOD);
    const { default: ExplorerPage } = await loadExplorerPage();
    const page = await ExplorerPage({ searchParams: Promise.resolve(query) });
    const markup = renderToStaticMarkup(page as never);

    expect(markup).not.toContain('/kr/seoul/tools/rent-check');
    expect(markup).not.toContain('Check my quote');
    expect(markup).not.toContain('Verified Explorer context');
    expect(markup).not.toMatch(/Noryangjin|Sindaebang|Megastudy/);
  });
});

describe('building dialog information flow', () => {
  it('puts Street View before evidence inside the scrolling body and keeps actions outside it', async () => {
    const { BuildingDialog } = await loadBuildingDialog();
    const markup = renderToStaticMarkup(
      createElement(BuildingDialog as never, {
        building: buildingWithMissingEvidence,
        open: true,
        rentCheckHref: verifiedRentCheckHref,
      }),
    );

    const bodyStart = markup.indexOf('class="building-dialog__body"');
    const streetView = markup.indexOf('class="building-dialog__street-view"');
    const evidence = markup.indexOf('class="building-dialog__evidence"');
    const bodyEnd = markup.indexOf('class="building-dialog__footer"');

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('Street View shows the nearby street, not a listing photo.');
    expect(markup).toContain('Street View unavailable in this parity preview');
    expect(markup).not.toContain('Street context preview');
    expect(bodyStart).toBeGreaterThan(-1);
    expect(streetView).toBeGreaterThan(bodyStart);
    expect(evidence).toBeGreaterThan(streetView);
    expect(bodyEnd).toBeGreaterThan(evidence);
    expect(markup.slice(bodyStart, bodyEnd)).not.toMatch(/Check my quote|Close details/);
    expect(markup.slice(bodyEnd)).toMatch(/Check my quote|Close details/);
  });

  it('never turns missing contract evidence into a fabricated zero', async () => {
    const { BuildingDialog } = await loadBuildingDialog();
    const markup = renderToStaticMarkup(
      createElement(BuildingDialog as never, {
        building: buildingWithMissingEvidence,
        open: true,
        rentCheckHref: null,
      }),
    );

    expect(markup).not.toMatch(/₩\s*0|0\s*contracts?|0(?:\.0+)?\s*㎡/i);
    expect(markup).not.toMatch(/undefined|null/i);
    expect(markup).toMatch(/Unavailable|Not provided by the official source/i);
  });

  it('hands the complete verified Explorer selection to Rent Check without quote values', async () => {
    const rentCheckHref = createExplorerRentCheckHref({
      lawdCd: '11590',
      type: 'officetel',
      dong: 'noryangjin-dong',
      building: 'noryangjin-dream-square',
    });

    expect(rentCheckHref).toBe(
      '/kr/seoul/tools/rent-check/?lawdCd=11590&type=officetel&dong=noryangjin-dong&building=noryangjin-dream-square',
    );
    const handoffQuery = new URLSearchParams(rentCheckHref?.split('?')[1] ?? '');
    expect([...handoffQuery.keys()]).toEqual([
      'lawdCd',
      'type',
      'dong',
      'building',
    ]);
    for (const forbiddenParameter of ['deposit', 'rent', 'monthlyRent', 'area']) {
      expect(handoffQuery.has(forbiddenParameter)).toBe(false);
    }
  });

  it.each([
    {
      name: 'orphan building',
      query: {
        lawdCd: '11590',
        type: 'officetel',
        building: 'noryangjin-dream-square',
      },
    },
    {
      name: 'wrong district',
      query: {
        lawdCd: '11680',
        type: 'officetel',
        dong: 'noryangjin-dong',
        building: 'noryangjin-dream-square',
      },
    },
    {
      name: 'raw HTML',
      query: {
        lawdCd: '11590',
        type: 'officetel',
        dong: '<b>Noryangjin</b>',
        building: '<img src=x onerror=alert(1)>',
      },
    },
    {
      name: 'unknown context',
      query: {
        lawdCd: '11590',
        type: 'unknown',
        dong: 'unknown-dong',
        building: 'unknown-building',
      },
    },
    {
      name: 'repeated context',
      query: {
        lawdCd: ['11590', '11680'],
        type: ['officetel', 'studio'],
        dong: ['noryangjin-dong', 'sindaebang-dong'],
        building: ['noryangjin-dream-square', 'megastudy-tower'],
      },
    },
  ])('does not render a Rent Check action for $name', async ({ query }) => {
    const { BuildingDialog } = await loadBuildingDialog();
    const rentCheckHref = createExplorerRentCheckHref(query);
    const markup = renderToStaticMarkup(
      createElement(BuildingDialog as never, {
        building: buildingWithMissingEvidence,
        open: true,
        rentCheckHref,
      }),
    );

    expect(rentCheckHref).toBeNull();
    expect(markup).not.toMatch(
      /href="\/kr\/seoul\/(?:tools\/rent-check\/|rent\/)/,
    );
    expect(markup).not.toContain('Check my quote');
    expect(markup).not.toMatch(/<b>Noryangjin<\/b>|onerror=alert/);
  });
});

describe('map and mobile scroll safety', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  const dialogSource = readFileSync(
    new URL('../components/building-dialog.tsx', import.meta.url),
    'utf8',
  );
  const workspaceSource = readFileSync(
    new URL('../components/explorer-workspace.tsx', import.meta.url),
    'utf8',
  );

  it('blocks only the SDK surface by default so explicit markers remain selectable', () => {
    expect(declarationsFor(css, '.explorer-map__sdk-surface')).toMatchObject({
      'pointer-events': 'none',
    });
    expect(
      declarationsFor(css, ".explorer-map[data-interactive='true'] .explorer-map__sdk-surface"),
    ).toMatchObject({ 'pointer-events': 'auto' });
    expect(workspaceSource).toContain('event.stopPropagation()');
  });

  it('keeps the dialog shell fixed while its body scrolls on desktop and mobile', () => {
    expect(declarationsFor(css, '.building-dialog')).toMatchObject({
      display: 'grid',
      overflow: 'hidden',
    });
    expect(declarationsFor(css, '.building-dialog__body')).toMatchObject({
      'overflow-y': 'auto',
      'overscroll-behavior': 'contain',
      '-webkit-overflow-scrolling': 'touch',
    });
    expect(declarationsFor(css, '.building-dialog__footer')).toMatchObject({
      position: 'sticky',
      bottom: '0',
    });

    expect(css).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*\.building-dialog\s*\{[\s\S]*max-height:\s*calc\(100dvh\s*-\s*[^;]+\);/,
    );
  });

  it('keeps the Street View slot proportional and the mobile map before a scrolling rail', () => {
    expect(declarationsFor(css, '.street-view-frame')).toMatchObject({
      width: 'min(760px, 100%)',
      'aspect-ratio': '760 / 428',
      height: 'auto',
    });
    expect(css).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*\.explorer-map\s*\{[\s\S]*order:\s*1;/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*\.explorer-rail\s*\{[\s\S]*order:\s*2;[\s\S]*max-height:\s*64dvh;[\s\S]*overflow-y:\s*auto;/,
    );
  });

  it('locks body scroll, traps focus and exposes an applied-area live status', () => {
    expect(dialogSource).toContain("document.body.style.overflow = 'hidden'");
    expect(dialogSource).toMatch(/event\.key\s*===\s*'Tab'/);
    expect(dialogSource).toContain('querySelectorAll<HTMLElement>');
    expect(workspaceSource).toContain('aria-live="polite"');
    expect(workspaceSource).toContain('state.map.revision');
  });

  it('includes Korean system fallbacks after the local Latin display face', () => {
    expect(declarationsFor(css, 'body')['font-family']).toMatch(
      /Archivo.*Noto Sans KR.*Apple SD Gothic Neo.*Malgun Gothic.*sans-serif/,
    );
  });
});
