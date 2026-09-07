import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('react', async original => ({
  ...await original<typeof import('react')>(),
  useSyncExternalStore: (_subscribe: unknown, snapshot: () => string) => snapshot(),
}));
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
