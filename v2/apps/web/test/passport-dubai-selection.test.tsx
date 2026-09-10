import { renderToStaticMarkup } from 'react-dom/server';
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useSyncExternalStore: (_subscribe: unknown, snapshot: () => string) => snapshot(),
}));
import { PassportFormContext } from '../components/passport/passport-journey';
import { DubaiAreaSelection, DubaiAreaSummary } from '../components/dubai/dubai-area-selection';
import { dubaiEvidenceFixture } from './dubai-evidence-fixture';
import { parseDubaiCheckQuery } from '../lib/dubai/check-model';
import { createDubaiEvidenceRepository } from '../lib/dubai/evidence-repository.server';
import { buildDubaiAreaModel } from '../lib/dubai/route-model.server';

async function areaModel() {
  const serialized = JSON.stringify(dubaiEvidenceFixture());
  const repository = await createDubaiEvidenceRepository({ serialized, expectedDigest: createHash('sha256').update(serialized).digest('hex') });
  const model = buildDubaiAreaModel(repository, 'marsa-dubai');
  if (model === null) throw new Error('missing area model');
  return model;
}

afterEach(() => vi.unstubAllGlobals());
describe('Dubai selection across a Passport journey', () => {
  it('keeps the area summary and Check action on the selected housing and sale stage', async () => {
    const path = '/ae/dubai/explore/marsa-dubai/';
    const search = '?stage=off-plan&housing=villa';
    vi.stubGlobal('window', { location: { pathname: path, search } });
    const model = await areaModel();
    const apartment = model.segments[0]!;
    const villa = { ...apartment, housing: 'villa' as const, sales: { ready: null, offPlan: { ...apartment.sales.ready!, n: 39, medianPriceAed: 4500000, medianPricePerSqmAed: 25000 } } };
    const html = renderToStaticMarkup(<DubaiAreaSummary model={{ ...model, segments: [apartment, villa] }} />);
    expect(html).toContain('data-summary-kind="area"');
    expect(html).toContain('Villa · Off-Plan · median sale price');
    expect(html).toContain('4,500,000');
    expect(html).toContain('39 registered sales');
    expect(html).toContain('25,000/m²');
    expect(html).toContain('Area-level statistics');
    expect(html).not.toContain('1,500,000');
    expect(html).not.toContain('data-building-summary');
    const href = html.match(/href="([^"]+)"/)![1]!.replaceAll('&amp;', '&');
    const query = Object.fromEntries(new URL(href, 'https://signedprice.test').searchParams);
    expect(parseDubaiCheckQuery(query)).toMatchObject({ area: 'marsa-dubai', completion: 'off-plan', housing: 'villa', askingPriceAed: null });
  });

  it('uses the published sale stage when the requested stage is suppressed', async () => {
    vi.stubGlobal('window', { location: { pathname: '/ae/dubai/explore/marsa-dubai/', search: '?stage=ready&housing=apartment' } });
    const model = await areaModel();
    const segment = model.segments[0]!;
    const html = renderToStaticMarkup(<DubaiAreaSummary model={{ ...model, segments: [{ ...segment, sales: { ready: null, offPlan: { ...segment.sales.ready!, n: 30, medianPriceAed: 2200000 } } }] }} locale="ko" />);
    expect(html).toContain('아파트 · 분양 중인 주택 · 매매가격 중앙값');
    expect(html).toContain('2,200,000');
    expect(html).toContain('30 건의 등록 매매');
    expect(html).not.toContain('1,500,000');
    expect(html).not.toContain('Parking');
  });

  it('shows the selected Off-Plan price and carries that stage into Check with an empty asking price', () => {
    const passport = '/ko/passport/?budget=500000&currency=USD&dubaiStage=off-plan';
    const path = '/ae/dubai/explore/marsa-dubai/';
    const search = `?stage=off-plan&housing=apartment&passport=${encodeURIComponent(passport)}`;
    vi.stubGlobal('window', { location: { pathname: path, search } });
    const fixture = dubaiEvidenceFixture().areas[0]!.segments[0]!;
    const segments = [{ ...fixture, sales: { ...fixture.sales, offPlan: { ...fixture.sales.ready!, medianPriceAed: 2200000 } }, comparableAreas: { ready: [], offPlan: [] } }];
    const price = renderToStaticMarkup(<DubaiAreaSelection slug="marsa-dubai" segments={segments} variant="price" />);
    expect(price).toContain('Off-Plan');
    expect(price).toContain('2,200,000');
    const html = renderToStaticMarkup(<DubaiAreaSelection slug="marsa-dubai" segments={segments} variant="check" />);
    const href = html.match(/href="([^"]+)"/)![1]!.replaceAll('&amp;', '&');
    const query = Object.fromEntries(new URL(href, 'https://signedprice.test').searchParams);
    expect(parseDubaiCheckQuery(query)).toMatchObject({ area: 'marsa-dubai', completion: 'off-plan', housing: 'apartment', askingPriceAed: null });
    expect(query.passport).toBe(passport);
    expect(query.returnTo).toBe(path + search);
  });
});

describe('Passport context in submitted Check forms', () => {
  it('keeps the original budget as a hidden field without populating an asking price', () => {
    const passport = '/ko/passport/?budget=500000&currency=USD&dubaiStage=off-plan';
    vi.stubGlobal('window', { location: { pathname: '/ae/dubai/check/', search: `?passport=${encodeURIComponent(passport)}` } });
    const html = renderToStaticMarkup(<form><PassportFormContext /></form>);
    expect(html).toContain('name="passport"');
    expect(html).toContain(passport.replaceAll('&', '&amp;'));
    expect(html).not.toContain('name="price"');
  });
  it('omits malformed or duplicated budget context', () => {
    for (const search of ['?passport=https%3A%2F%2Fevil.test', '?passport=%2Fpassport%2F%3Fbudget%3D500000&passport=%2Fpassport%2F%3Fbudget%3D600000']) {
      vi.stubGlobal('window', { location: { pathname: '/ae/dubai/check/', search } });
      expect(renderToStaticMarkup(<PassportFormContext />)).toBe('');
    }
  });
});
