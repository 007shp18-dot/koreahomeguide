import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import IntentPage from '../app/(en)/[country]/[city]/[intent]/page';
import ComparePage from '../app/(en)/compare/page';
import { SameCashWorkspace } from '../components/same-cash-workspace';
import {
  buildComparisonPageModel,
  buildIntentPageModel,
  intentRouteParams,
} from '../lib/route-model';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

const expectedIntentRows = [
  { number: '01', title: 'Decision scope' },
  { number: '02', title: 'Usable source classes' },
  { number: '03', title: 'Blocked detail' },
] as const;

type DecisionRow = {
  readonly number: string;
  readonly title: string;
  readonly items: readonly {
    readonly label: string;
    readonly state?: 'available' | 'limited' | 'rights_blocked' | 'not_built';
  }[];
};

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

function navigationMarkup(markup: string): string {
  return (
    markup.match(/<nav[^>]*aria-label="Primary navigation"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? ''
  );
}

describe('nine intent routes use one connected decision hierarchy', () => {
  it('builds exactly three ordered rows for every approved intent route', () => {
    expect(intentRouteParams).toHaveLength(9);

    for (const { country, city, intent } of intentRouteParams) {
      const model = buildIntentPageModel(country, city, intent);
      const rows = Reflect.get(model ?? {}, 'decisionRows') as
        | readonly DecisionRow[]
        | undefined;

      expect(rows?.map(({ number, title }) => ({ number, title }))).toEqual(
        expectedIntentRows,
      );
    }
  });

  it('renders three connected rows instead of two card grids and a repeated limitations block', async () => {
    for (const params of intentRouteParams) {
      const markup = renderToStaticMarkup(
        await IntentPage({ params: Promise.resolve(params) }),
      );

      expect(markup.match(/class="intent-decision-row"/g)).toHaveLength(3);
      expect(markup).not.toContain('class="capability-grid"');
      expect(markup).not.toContain('<section class="market-limitations');

      let previousIndex = -1;
      for (const row of expectedIntentRows) {
        const index = markup.indexOf(`>${row.title}<`);
        expect(index).toBeGreaterThan(previousIndex);
        previousIndex = index;
      }
    }
  });

  it('keeps usable evidence out of blocked detail and blocked evidence out of usable sources', () => {
    const cases = [
      {
        route: ['kr', 'seoul', 'rent'] as const,
        usable: /Official reported contract intelligence/i,
        blocked: /Professional connection detail/i,
      },
      {
        route: ['sg', 'singapore', 'buy'] as const,
        usable: /URA private residential sale intelligence/i,
        blocked: /Rental and professional detail/i,
      },
      {
        route: ['ae', 'dubai', 'invest'] as const,
        usable: /Rights-cleared area and project context/i,
        blocked: /Licensed transaction detail/i,
      },
    ];

    for (const { route, usable, blocked } of cases) {
      const model = buildIntentPageModel(route[0], route[1], route[2]);
      const rows = Reflect.get(model ?? {}, 'decisionRows') as
        | readonly DecisionRow[]
        | undefined;
      const usableRow = rows?.[1];
      const blockedRow = rows?.[2];
      const usableCopy = usableRow?.items.map((item) => item.label).join(' ') ?? '';
      const blockedCopy = blockedRow?.items.map((item) => item.label).join(' ') ?? '';

      expect(usableCopy).toMatch(usable);
      expect(usableCopy).not.toMatch(blocked);
      expect(usableRow?.items.every((item) => item.state !== 'rights_blocked')).toBe(
        true,
      );
      expect(blockedCopy).toMatch(blocked);
      expect(blockedCopy).not.toMatch(usable);
      expect(blockedRow?.items.some((item) => item.state === 'rights_blocked')).toBe(
        true,
      );
    }
  });

  it('leaves all shared product links inactive because an intent is not a product route', async () => {
    for (const params of intentRouteParams) {
      const markup = navigationMarkup(
        renderToStaticMarkup(await IntentPage({ params: Promise.resolve(params) })),
      );

      expect(markup.match(/<a /g) ?? []).toHaveLength(7);
      for (const label of ['Markets', 'Prices', 'Properties', 'News', 'Community', 'Guides', 'Invest']) {
        expect(markup).toContain(`>${label}</a>`);
      }
      expect(markup).not.toContain('aria-current');
    }
  });
});

describe('intent rows follow the square Modernist system', () => {
  it('contains the rows and keeps status labels adjacent to their copy', () => {
    expect(declarationsFor(css, '.intent-decision.site-shell')).toMatchObject({
      width: 'min(calc(100% - (2 * var(--page-gutter))), var(--content-frame))',
      margin: '24px auto 0',
      padding: '0',
    });
    expect(declarationsFor(css, '.intent-decision-row__summary')).toMatchObject({
      'grid-template-columns': 'minmax(0, 1fr) minmax(96px, max-content)',
    });
    expect(declarationsFor(css, '.intent-decision-row__items li')).toMatchObject({
      'grid-template-columns': 'minmax(0, 1fr) minmax(96px, max-content)',
    });
  });

  it('uses connected zero-radius rows with two-pixel structural rules', () => {
    expect(declarationsFor(css, '.intent-decision-rows')).toMatchObject({
      'border-top': '2px solid var(--ink)',
      'border-bottom': '2px solid var(--ink)',
      'border-radius': '0',
    });
    expect(declarationsFor(css, '.intent-decision-row')).toMatchObject({
      display: 'grid',
      'grid-template-columns': 'minmax(180px, 240px) minmax(0, 1fr)',
      'border-bottom': '1px solid var(--line)',
    });
    expect(declarationsFor(css, '.intent-decision-row__label')).toMatchObject({
      'border-right': '2px solid var(--ink)',
    });
  });
});

describe('comparison remains a semantic Modernist table', () => {
  it('keeps caption, column headers, row headers and all status labels in the rendered table', () => {
    const model = buildComparisonPageModel();
    const markup = renderToStaticMarkup(createElement(ComparePage));

    expect(markup).toContain('<table class="comparison-matrix">');
    expect(markup).toContain(`<caption>${model.matrix.tableLabel}</caption>`);
    expect(markup).toContain('<thead>');
    expect(markup).toContain('<tbody>');
    expect(markup.match(/<th scope="col"/g)).toHaveLength(4);
    expect(markup.match(/<th scope="row"/g)).toHaveLength(6);
    expect(markup.match(/class="status-label status-label--/g)).toHaveLength(18);
  });

  it('numbers the six approved rows from 01 through 06 without changing their meaning', () => {
    const model = buildComparisonPageModel();
    const markup = renderToStaticMarkup(createElement(ComparePage));

    expect(model.matrix.rows.map((row) => row.label)).toEqual([
      'Rent evidence',
      'Sale evidence',
      'Foreign-buyer rules',
      'Ownership costs',
      'Yield analysis',
      'Full local workflow',
    ]);
    expect(
      [...markup.matchAll(/class="comparison-matrix__row-number">(\d{2})<\/span>/g)].map(
        (match) => match[1],
      ),
    ).toEqual(['01', '02', '03', '04', '05', '06']);
  });

  it('keeps shared product links inactive on the global comparison route', () => {
    const markup = navigationMarkup(renderToStaticMarkup(createElement(ComparePage)));

    expect(markup.match(/<a /g) ?? []).toHaveLength(7);
    expect(markup).toContain('>Prices</a>');
    expect(markup).not.toContain('aria-current="page"');
  });

  it('keeps Singapore private sales separate and Dubai transaction detail blocked', () => {
    const model = buildComparisonPageModel();
    const rentRow = model.matrix.rows[0];
    const saleRow = model.matrix.rows[1];
    const yieldRow = model.matrix.rows[4];

    const singaporeRent = rentRow?.cells.find((cell) => cell.marketId === 'sg-singapore');
    expect(singaporeRent).toMatchObject({
      state: 'rights_blocked',
      description: expect.stringMatching(/^No Singapore rental/),
    });
    const singaporeSale = saleRow?.cells.find((cell) => cell.marketId === 'sg-singapore');
    expect(singaporeSale).toMatchObject({
      state: 'limited',
      description: expect.stringMatching(/^URA private residential/),
    });

    const dubaiYield = yieldRow?.cells.find((cell) => cell.marketId === 'ae-dubai');
    expect(dubaiYield).toMatchObject({
      state: 'rights_blocked',
      description: expect.stringMatching(/cannot be inferred/i),
    });
  });

  it('uses zero-radius two-pixel table rules and an internally scrollable mobile region', () => {
    expect(declarationsFor(css, '.comparison-matrix__scroll')).toMatchObject({
      width: '100%',
      'overflow-x': 'auto',
      border: '2px solid var(--ink)',
      'border-radius': '0',
    });
    expect(declarationsFor(css, '.comparison-matrix')).toMatchObject({
      width: '100%',
      'min-width': '860px',
      'border-collapse': 'collapse',
    });
    expect(declarationsFor(css, '.comparison-matrix th')).toMatchObject({
      'border-right': '2px solid var(--ink)',
    });
    expect(declarationsFor(css, '.comparison-matrix__row-number')).toMatchObject({
      display: 'block',
    });
    expect(declarationsFor(css, 'body')['overflow-x']).toBe('clip');
  });
});

describe('same-cash comparison follows the result-first sequence', () => {
  it('renders editable assumptions before the verdict and calculation evidence', () => {
    const markup = renderToStaticMarkup(createElement(SameCashWorkspace));
    const inputs = markup.indexOf('data-check-section="inputs"');
    const verdict = markup.indexOf('data-check-section="verdict"');
    const evidence = markup.indexOf('data-check-section="evidence"');

    expect(inputs).toBeGreaterThan(-1);
    expect(inputs).toBeLessThan(verdict);
    expect(verdict).toBeLessThan(evidence);
  });
});
