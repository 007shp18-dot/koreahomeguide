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
    expect(html).not.toContain('/kr/seoul/');
    expect(html).not.toMatch(/jeonse|KRW|winner/i);
  });

  it('renders a verified single-offer result without a winner claim', () => {
    const html = renderToStaticMarkup(<SingaporeCheckWorkspace model={{ ...model, result: { kind: 'single', offer: {
      status: 'ready', market: 'ura-private-sale', amountSgd: 350_000, sourceIdentifier: 'URA',
      window: { from: '2026-08', to: '2026-08', monthCount: 1, maximumMonthCount: 12 },
      scope: { level: 'exact', label: 'Selected project and filters' }, fallbackDisclosure: null,
      distribution: { minimum: 100_000, p25: 200_000, median: 300_000, p75: 400_000, maximum: 500_000 },
      percentile: 60, sampleCount: 5, minimumSample: 5,
      secondary: { kind: 'ura-private-sale', medianPsf: 1_900, tenures: ['99 yrs'], floorRanges: ['06-10'], saleTypes: ['Resale'] },
    } } }} />);
    expect(html).toContain('SGD 300,000');
    expect(html).toContain('60th percentile');
    expect(html).toContain('2026-08–2026-08');
    expect(html).toContain('URA');
    expect(html).not.toMatch(/winner/i);
  });
});
