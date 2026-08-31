import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PublicSourceBoundary } from '../components/public-market/public-source-boundary';
import type { PublicAreaSourceBoundaryModel } from '../lib/public-market/area-route-types';

const model: PublicAreaSourceBoundaryModel = {
  provider: 'MOLIT',
  period: '2026-01/2026-07',
  attribution: ['Ministry of Land, Infrastructure and Transport (MOLIT)'],
  band: '45–55㎡',
  publicationMinimum: 5,
  includesNewAndRenewal: true,
  includesUnknownContractType: true,
  includesUnknownRecordStatus: true,
  geometryAttribution:
    'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0)',
};

describe('public source boundary', () => {
  it('renders the complete reviewed source, filter, rights, and refusal boundary', () => {
    const html = renderToStaticMarkup(<PublicSourceBoundary model={model} />);

    for (const visible of [
      'MOLIT',
      '2026-01/2026-07',
      '45–55㎡',
      'Refundable zero-rent jeonse',
      'Canceled records are excluded',
      'New and renewal contracts are combined',
      'Unknown contract type',
      'Unknown record status',
      'Ministry of Land, Infrastructure and Transport (MOLIT)',
      'KOSTAT census boundaries via southkorea/seoul-maps (Apache-2.0)',
      'not current listings',
      'not an appraisal',
      'not legal advice',
      'n &lt; 5',
    ]) {
      expect(html).toContain(visible);
    }
  });

  it('never asks a reader for contact or subscription details', () => {
    const html = renderToStaticMarkup(<PublicSourceBoundary model={model} />);

    expect(html).not.toMatch(/<(?:input|form)\b/i);
    expect(html).not.toMatch(/e-?mail|subscribe|newsletter/i);
  });

  it('omits a geometry row when the shared boundary has no map source', () => {
    const sharedModel = { ...model, geometryAttribution: undefined };
    const html = renderToStaticMarkup(<PublicSourceBoundary model={sharedModel} />);

    expect(html).not.toContain('Geometry');
    expect(html).not.toContain('southkorea/seoul-maps');
  });
});
