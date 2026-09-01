import {
  createCorrectionLedger,
  createEvidenceDescriptor,
  createEvidenceEmptyState,
} from '@signedprice/market-core';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CorrectionLedger } from '../components/trust/correction-ledger';
import { EvidenceDisclosure } from '../components/trust/evidence-disclosure';
import { EvidenceEmptyStatePanel } from '../components/trust/evidence-empty-state';

const evidence = createEvidenceDescriptor({
  marketId: 'kr-seoul',
  provider: 'MOLIT',
  dataset: 'reported rent contracts',
  period: '2026-01/2026-07',
  generatedAt: '2026-08-30T00:00:00.000Z',
  state: 'ready',
  publicationMinimum: 5,
  methodologyId: 'kr-jeonse-45-55-v1',
  rightsPolicyId: 'kr-molit-rent-v1',
});

describe('shared trust components', () => {
  it('uses a compact four-column desktop disclosure grid', () => {
    const css = readFileSync(
      new URL('../components/trust/trust.module.css', import.meta.url),
      'utf8',
    );

    expect(css).toMatch(/\.disclosureGrid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  });

  it('renders every evidence field and explicit boundary in server HTML', () => {
    const html = renderToStaticMarkup(
      <EvidenceDisclosure
        model={evidence}
        boundary="Reported completed-period contracts, not current listings."
        attribution={['Ministry of Land, Infrastructure and Transport (MOLIT)']}
      />,
    );

    for (const visible of [
      'Source',
      'MOLIT',
      'Dataset',
      'reported rent contracts',
      'Period',
      '2026-01/2026-07',
      'Generated',
      '2026-08-30T00:00:00.000Z',
      'Method',
      'kr-jeonse-45-55-v1',
      'Rights',
      'kr-molit-rent-v1',
      'Publication minimum',
      '5',
      'Boundary',
      'Reported completed-period contracts, not current listings.',
      'Ministry of Land, Infrastructure and Transport (MOLIT)',
    ]) {
      expect(html).toContain(visible);
    }
  });

  it('renders an empty state with title, reason, and a real next action', () => {
    const state = createEvidenceEmptyState({
      code: 'INSUFFICIENT',
      count: 4,
      threshold: 5,
    });
    const html = renderToStaticMarkup(
      <EvidenceEmptyStatePanel state={state} actionHref="/kr/seoul/explore/" />,
    );

    expect(html).toContain('<h2');
    expect(html).toContain(state.title);
    expect(html).toContain(state.reason);
    expect(html).toContain(state.nextAction);
    expect(html).toContain('href="/kr/seoul/explore"');
    expect(html).not.toMatch(/>0(?:\.0)?</);
  });

  it('renders an honest empty correction ledger', () => {
    const html = renderToStaticMarkup(
      <CorrectionLedger corrections={createCorrectionLedger([])} />,
    );

    expect(html).toContain('No published corrections');
    expect(html).toContain('The ledger is empty');
    expect(html).not.toMatch(/Fixed|Upheld/);
  });

  it('labels fixed and upheld corrections in text and newest-first order', () => {
    const corrections = createCorrectionLedger([
      {
        id: 'older', date: '2026-08-01', marketId: 'kr-seoul',
        scope: 'district-summary', status: 'UPHELD', raisedBy: 'USER',
        summary: 'The published record was checked and retained.',
      },
      {
        id: 'newer', date: '2026-08-30', marketId: 'kr-seoul',
        scope: 'district-summary', status: 'FIXED', raisedBy: 'INTERNAL',
        summary: 'A display label was corrected.',
      },
    ]);
    const html = renderToStaticMarkup(<CorrectionLedger corrections={corrections} />);

    expect(html).toContain('Fixed');
    expect(html).toContain('Upheld');
    expect(html.indexOf('A display label was corrected.')).toBeLessThan(
      html.indexOf('The published record was checked and retained.'),
    );
  });
});
