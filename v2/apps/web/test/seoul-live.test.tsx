import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { SeoulLive } from '../components/public-market/seoul-live';
import { buildSeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import {
  createPublicAreaV2Fixture,
  PUBLIC_AREA_FIXTURE_PERIOD,
} from './public-area-fixture';

describe('Seoul live entry model', () => {
  it('exposes split counts and every shipped Seoul destination from verified evidence', () => {
    const model = buildSeoulLiveModel({
      source: createPublicAreaV2Fixture(),
      period: PUBLIC_AREA_FIXTURE_PERIOD,
    });

    expect(model).toMatchObject({
      status: 'ready',
      period: PUBLIC_AREA_FIXTURE_PERIOD,
      totalCount: 275,
      newCount: 125,
      renewalCount: 125,
      unknownCount: 25,
    });
    const html = renderToStaticMarkup(<SeoulLive model={model} mode="global" />);
    expect(html).toContain('Seoul live');
    expect(html).toContain('275');
    expect(html).toContain('New contracts');
    expect(html).toContain('125');
    expect(html).toContain('Renewals');
    expect(html).toContain('Unknown type');
    for (const href of [
      '/kr/seoul/check',
      '/kr/seoul/explore',
      '/kr/seoul/rankings',
      '/kr/seoul/news',
      '/kr/seoul/guide',
    ]) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  it('keeps product routes visible without leaking counts or money when evidence is unavailable', () => {
    const model = buildSeoulLiveModel({ source: undefined, period: '' });
    const html = renderToStaticMarkup(<SeoulLive model={model} mode="korea" />);

    expect(model).toEqual({
      status: 'unavailable',
      message: 'Official Seoul evidence is temporarily unavailable.',
      links: expect.any(Array),
    });
    expect(html).toContain('Official Seoul evidence is temporarily unavailable.');
    expect(html).not.toMatch(/₩|\b\d{1,3}(?:,\d{3})+\b/);
    expect(html).toContain('href="/kr/seoul/explore"');
    expect(html).toContain('href="/kr/seoul/news"');
  });
});
