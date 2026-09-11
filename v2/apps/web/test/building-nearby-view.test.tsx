import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BuildingNearbyView } from '../components/maps/building-nearby-view';
import { ProjectedEntityMedia } from '../components/public-market/projected-entity-media';

describe('nearby imagery loading boundary', () => {
  it.each(['seoul', 'singapore'] as const)('keeps %s provider scripts and embeds out of the initial render', market => {
    const html = renderToStaticMarkup(<BuildingNearbyView locale="ko" market={market}
      providerKey="browser-test-key" buildingName="Example" latitude={1.3} longitude={103.8} mapHref="/map/" />);
    expect(html).toContain('주변 거리뷰 보기');
    expect(html).toContain('<button');
    expect(html).not.toMatch(/<script|<iframe|browser-test-key|data-media-state="loading"/);
  });

  it('offers a usable map link when the provider is not configured', () => {
    const html = renderToStaticMarkup(<BuildingNearbyView locale="ko" market="seoul"
      providerKey={null} buildingName="Example" mapHref="/map/" />);
    expect(html).toContain('href="/map/"');
    expect(html).not.toContain('<button');
  });

  it('shows the on-demand control immediately for a known missing Singapore photo', () => {
    const html = renderToStaticMarkup(<ProjectedEntityMedia locale="ko" buildingName="Example"
      address="10 Example Street, Singapore" fallbackMarket="singapore" browserKey="browser-test-key" media={null} />);
    expect(html).toContain('nearby-view-on-demand');
    expect(html).not.toContain('Loading verified place photo');
    expect(html).not.toMatch(/<script|<iframe/);
  });

  it('keeps an available building image ahead of the optional nearby view', () => {
    const html = renderToStaticMarkup(<ProjectedEntityMedia buildingName="Example"
      address="10 Example Street, Singapore" fallbackMarket="singapore" browserKey="browser-test-key"
      media={{ displayUrl: '/example.jpg', width: 800, height: 600, focalX: null, focalY: null,
        attributionName: 'Owner', attributionUrl: null }} />);
    expect(html).toContain('src="/example.jpg"');
    expect(html).not.toContain('nearby-view-on-demand');
    expect(html).not.toMatch(/<script|<iframe/);
  });
});
