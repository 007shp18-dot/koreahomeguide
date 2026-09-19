import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EditorialGuides } from '../components/guide/editorial-guides';
import { parsePropertyScenarioContext } from '../lib/tools/property-scenario-context';

describe('guide calculator city context', () => {
  it.each([
    ['seoul', 'kr-seoul', 'KRW'],
    ['singapore', 'sg-singapore', 'SGD'],
    ['dubai', 'ae-dubai', 'AED'],
    ['tokyo', 'jp-tokyo', 'JPY'],
  ] as const)('opens the %s calculator with the matching currency', (city, market, currency) => {
    const html = renderToStaticMarkup(<EditorialGuides market={city} />);
    expect(html).toContain(`href="/news?topic=budget&amp;market=${city}"`);
    const href = html.match(/href="([^"]*\/tools\/property-scenario[^\"]*)"/)?.[1];
    expect(href).toBeDefined();
    const url = new URL(href!.replaceAll('&amp;', '&'), 'https://signedprice.com');
    expect(parsePropertyScenarioContext(Object.fromEntries(url.searchParams))).toMatchObject({ market, currency });
  });
  it('keeps city tabs in the sitewide order', () => {
    const html = renderToStaticMarkup(<EditorialGuides market="seoul" />);
    const tabs = html.match(/aria-label="Guide cities"[\s\S]*?<\/nav>/)?.[0] ?? '';
    expect([...tabs.matchAll(/>((?:Seoul|Singapore|Dubai|Tokyo))<\/a>/g)].map(match => match[1])).toEqual(['Seoul', 'Singapore', 'Dubai', 'Tokyo']);
  });
});
