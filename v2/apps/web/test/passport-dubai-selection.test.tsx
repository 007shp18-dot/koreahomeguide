import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useSyncExternalStore: (_subscribe: unknown, snapshot: () => string) => snapshot(),
}));
import { PassportFormContext } from '../components/passport/passport-journey';
import { DubaiAreaSelection } from '../components/dubai/dubai-area-selection';
import { dubaiEvidenceFixture } from './dubai-evidence-fixture';
import { parseDubaiCheckQuery } from '../lib/dubai/check-model';

afterEach(() => vi.unstubAllGlobals());
describe('Dubai selection across a Passport journey', () => {
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
