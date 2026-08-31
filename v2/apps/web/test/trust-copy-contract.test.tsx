import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import TrustPage from '../app/trust/page';
import KoreaCorrectionsPage from '../app/kr/seoul/corrections/page';

describe('Trust publication copy contract', () => {
  it('publishes evidence limits while refusing unsupported accuracy claims', () => {
    const html = [
      renderToStaticMarkup(<TrustPage />),
      renderToStaticMarkup(<KoreaCorrectionsPage />),
    ].join('\n');

    for (const required of [
      'Evidence states',
      'Freshness',
      'Rights',
      'Corrections',
      'No model-accuracy figure is currently published',
      'No published corrections',
    ]) {
      expect(html).toContain(required);
    }
    expect(html).not.toMatch(/191,067|8\.2%|most accurate|guaranteed return/i);
  });
});
