import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PublicSourceBoundary } from '../components/public-market/public-source-boundary';
import type { PublicAreaSourceBoundaryModel } from '../lib/public-market/area-route-types';
import { createEvidenceDescriptor } from '@signedprice/market-core';

const model: PublicAreaSourceBoundaryModel = {
  evidence: createEvidenceDescriptor({
    marketId: 'kr-seoul',
    provider: 'MOLIT',
    dataset: 'reported rent contracts',
    period: '2026-01/2026-07',
    generatedAt: '2026-08-31T01:13:24.787Z',
    state: 'ready',
    publicationMinimum: 5,
    methodologyId: 'kr-jeonse-45-55-v1',
    rightsPolicyId: 'kr-molit-rent-v1',
  }),
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
      'Dataset',
      'Generated',
      '2026-08-31T01:13:24.787Z',
      'Method',
      'kr-jeonse-45-55-v1',
      'Rights',
      'kr-molit-rent-v1',
      'Boundary',
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

  it('shows an explicit evidence-unavailable state when no verified descriptor exists', () => {
    const html = renderToStaticMarkup(
      <PublicSourceBoundary model={{ ...model, evidence: null }} />,
    );

    expect(html).toContain('Evidence source is unavailable');
    expect(html).toContain('Try again after the source recovers.');
    expect(html).not.toContain('2026-08-31T01:13:24.787Z');
  });
});
