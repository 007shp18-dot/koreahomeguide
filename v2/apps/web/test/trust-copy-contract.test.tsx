import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import TrustPage from '../app/(en)/trust/page';
import KoreaCorrectionsPage from '../app/(en)/kr/seoul/corrections/page';

describe('Trust publication copy contract', () => {
  it('publishes evidence limits while refusing unsupported accuracy claims', () => {
    const html = [
      renderToStaticMarkup(<TrustPage />),
      renderToStaticMarkup(<KoreaCorrectionsPage />),
    ].join('\n');

    for (const required of [
      'Where do the prices come from?',
      'When is the data updated?',
      'source rights explicitly permit each use',
      'How can I report an error?',
      'We do not publish an accuracy score',
      'No published corrections',
    ]) {
      expect(html).toContain(required);
    }
    expect(html).not.toMatch(/191,067|8\.2%|most accurate|guaranteed return/i);
  });
});
