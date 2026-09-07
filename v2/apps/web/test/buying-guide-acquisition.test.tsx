import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BuyingGuide } from '../components/newsroom/buying-guide';
import { BUYING_GUIDE_DATA } from '../content/en/buying-guide-data';
import { createBuyingGuideEvent, guideJourney, GUIDE_ACTIONS } from '../lib/analytics/buying-guide-events';
import { sendGoogleEvent } from '../lib/analytics/google-events';

afterEach(() => vi.unstubAllGlobals());

it.each(BUYING_GUIDE_DATA)('connects $city to its own records, check and report', guide => {
  const journey = guideJourney(guide.slug)!;
  const html = renderToStaticMarkup(<BuyingGuide guide={guide} />);
  for (const href of [journey.explore, journey.check, journey.report]) expect(html).toContain(`href="${href.replace(/\/$/, '')}"`);
  for (const action of GUIDE_ACTIONS) expect(createBuyingGuideEvent(guide.slug, action)).toEqual({
    event: 'buying_guide_action', guide: guide.slug, market: journey.market, action,
  });
});

it('rejects arbitrary guide and action values', () => {
  expect(() => createBuyingGuideEvent('__proto__', 'budget_select')).toThrow();
  expect(() => createBuyingGuideEvent(BUYING_GUIDE_DATA[0]!.slug, 'address' as never)).toThrow();
});

it('forwards coarse dimensions without query strings or entered values', () => {
  const gtag = vi.fn();
  vi.stubGlobal('window', { gtag, localStorage: { getItem: () => null }, location: { origin: 'https://www.signedprice.com', pathname: '/guides/example/', search: '?address=private' } });
  sendGoogleEvent('buying_guide_action', { market: 'ae-dubai', action: 'budget_select', address: 'private', budget: 1000 });
  expect(gtag).toHaveBeenCalledExactlyOnceWith('event', 'buying_guide_action', { market: 'ae-dubai', action: 'budget_select', page_location: 'https://www.signedprice.com/guides/example/' });
});

it('respects opt-outs and tolerates missing or blocked analytics', () => {
  const gtag = vi.fn();
  vi.stubGlobal('window', { gtag, localStorage: { getItem: () => 'denied' } });
  sendGoogleEvent('buying_guide_action', { market: 'ae-dubai' });
  expect(gtag).not.toHaveBeenCalled();
  vi.stubGlobal('window', { localStorage: { getItem: () => null } });
  expect(() => sendGoogleEvent('buying_guide_action', {})).not.toThrow();
  vi.stubGlobal('window', { gtag: () => { throw new Error('blocked'); }, localStorage: { getItem: () => { throw new Error('blocked'); } }, location: { origin: 'https://www.signedprice.com', pathname: '/' } });
  expect(() => sendGoogleEvent('buying_guide_action', {})).not.toThrow();
});
