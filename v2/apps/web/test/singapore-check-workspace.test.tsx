import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SingaporeCheckWorkspace } from '../components/singapore/singapore-check-workspace';
import type { SingaporeCheckRouteModel } from '../lib/singapore/check-route-model.server';

const emptyCatalog = { available: false, months: [], segments: [], projects: [], districts: [], propertyTypes: [], floorRanges: [], saleTypes: [], towns: [], blocks: [], flatTypes: [], storeyRanges: [] } as const;
const model: SingaporeCheckRouteModel = {
  mode: 'single',
  catalogs: {
    'ura-private-sale': { ...emptyCatalog, available: true, months: ['2026-08'], segments: ['CCR'], projects: [{ id: 'project-a', label: 'Project A' }], districts: ['09'], propertyTypes: ['Condominium'], floorRanges: ['06-10'], saleTypes: ['Resale'] },
    'hdb-resale': emptyCatalog,
    'hdb-rent': emptyCatalog,
  },
  drafts: { a: { market: 'ura-private-sale' }, b: { market: 'hdb-rent' } },
  result: { kind: 'empty' },
};

describe('Singapore Check workspace', () => {
  it('keeps optional fields collapsed while retaining values in the GET form', () => {
    const html = renderToStaticMarkup(<SingaporeCheckWorkspace model={model} />);
    expect(html).toContain('More comparison options');
    const start = html.indexOf('<details data-comparison-options=');
    const advanced = html.slice(start, html.indexOf('</details>', start));
    expect(advanced).toContain('name="a-floor-range"');
    expect(advanced).toContain('name="a-sale-type"');
    expect(advanced).toContain('name="a-month"');
    expect(advanced).not.toMatch(/<details[^>]*open/);
    expect(html.indexOf('name="a-project"')).toBeLessThan(html.indexOf('name="a-amount"'));
  });

  it('opens non-default advanced conditions handed over in a shared result', () => {
    const html = renderToStaticMarkup(<SingaporeCheckWorkspace model={{ ...model, drafts: { ...model.drafts, a: { market: 'ura-private-sale', 'floor-range': '06-10' } } }} />);
    expect(html).toMatch(/<details[^>]*open/);
    expect(html).toContain('<option value="06-10" selected="">');
  });
  it('offers a usable evidence link instead of an empty HDB form', () => {
    const html = renderToStaticMarkup(<SingaporeCheckWorkspace model={{...model, drafts:{...model.drafts, a:{market:'hdb-resale'}}}} />);
    expect(html).toContain('Explore Singapore transactions');
    expect(html).not.toContain('name="a-amount"');
    expect(html).toMatch(/<button[^>]*disabled/);
  });
  it('owns its native markets and never links into Seoul', () => {
    const html = renderToStaticMarkup(<SingaporeCheckWorkspace model={model} />);

    expect(html).toContain('data-singapore-check-workspace="true"');
    expect(html).toContain('URA private sale');
    expect(html).toContain('HDB resale');
    expect(html).toContain('HDB rent');
    expect(html).toContain('Recent completed months only');
    expect(html).toContain('name="a-amount"');
    expect(html).toContain('name="a-project"');
    expect(html).toContain('P25–P75');
    expect(html).toContain('href="/sg/singapore/explore"');
    expect(html).toContain('href="/sg/singapore/rankings"');
    // City switching may link to another market; the actual tool must stay Singapore-only.
    const workspace = html.slice(html.indexOf('data-singapore-check-workspace="true"'), html.indexOf('</main>'));
    expect(workspace).not.toContain('/kr/seoul/check');
    expect(html).not.toMatch(/jeonse|KRW|winner/i);
  });

  it.each([['en', '21st', 'Reporting period', 'Sample', 'Source'], ['ko', '21백분위', '집계 기간', '표본 수', '출처']] as const)('renders a %s percentile with its source, period and sample', (locale, percentile, period, sample, source) => {
    const html = renderToStaticMarkup(<SingaporeCheckWorkspace locale={locale} model={{ ...model, result: { kind: 'single', offer: {
      status: 'ready', market: 'ura-private-sale', amountSgd: 350_000, sourceIdentifier: 'URA',
      window: { from: '2026-08', to: '2026-08', monthCount: 1, maximumMonthCount: 12 },
      scope: { level: 'exact', label: 'Selected project and filters' }, fallbackDisclosure: null,
      distribution: { minimum: 100_000, p25: 200_000, median: 300_000, p75: 400_000, maximum: 500_000 },
      percentile: 21, sampleCount: 5, minimumSample: 5,
      secondary: { kind: 'ura-private-sale', medianPsf: 1_900, tenures: ['99 yrs'], floorRanges: ['06-10'], saleTypes: ['Resale'] },
    } } }} />);
    expect(html).toContain('SGD 300,000');
    expect(html).toContain(percentile);
    expect(html).not.toContain('21th');
    expect(html).toContain(period);
    expect(html).toContain(`<dt>${sample}</dt><dd>5</dd>`);
    expect(html).toContain(`<dt>${source}</dt><dd>URA</dd>`);
    expect(html).toContain('2026-08–2026-08');
    expect(html).toContain('URA');
    expect(html).not.toMatch(/winner/i);
  });
});
