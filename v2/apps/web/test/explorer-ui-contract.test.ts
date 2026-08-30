import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { intentRouteParams, marketRouteParams } from '../lib/route-model';

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

describe('/kr/seoul/explore/ route contract', () => {
  it('renders the new noindex Seoul Explorer with an explicit three-step discovery rail', async () => {
    const { default: ExplorerPage, metadata } = await loadExplorerPage();
    const page = await ExplorerPage({
      searchParams: Promise.resolve({ lawdCd: '11590' }),
    });
    const markup = renderToStaticMarkup(page as never);

    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(markup).toContain('Dongjak-gu (동작구)');
    expect(markup).not.toMatch(/>\s*11590\s*</);
    expect(markup).toContain('data-discovery-step="district"');
    expect(markup).toContain('data-discovery-step="neighborhood"');
    expect(markup).toContain('data-discovery-step="building"');
    expect(markup).toContain('Search this area');
    expect(markup).toContain('Interact with map');
    expect(markup).toContain('role="region"');
    expect(markup).not.toContain('role="img"');
    expect(markup).toContain('class="explorer-marker"');
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
});

describe('building dialog information flow', () => {
  it('puts Street View before evidence inside the scrolling body and keeps actions outside it', async () => {
    const { BuildingDialog } = await loadBuildingDialog();
    const markup = renderToStaticMarkup(
      createElement(BuildingDialog as never, {
        building: buildingWithMissingEvidence,
        open: true,
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
      }),
    );

    expect(markup).not.toMatch(/₩\s*0|0\s*contracts?|0(?:\.0+)?\s*㎡/i);
    expect(markup).not.toMatch(/undefined|null/i);
    expect(markup).toMatch(/Unavailable|Not provided by the official source/i);
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
