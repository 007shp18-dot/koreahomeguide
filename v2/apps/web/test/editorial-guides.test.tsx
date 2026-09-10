import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EditorialGuides } from '../components/guide/editorial-guides';
import { parsePropertyScenarioContext } from '../lib/tools/property-scenario-context';

describe('guide calculator city context', () => {
  it.each([
    ['seoul', 'kr-seoul', 'KRW'],
    ['singapore', 'sg-singapore', 'SGD'],
    ['dubai', 'ae-dubai', 'AED'],
  ] as const)('opens the %s calculator with the matching currency', (city, market, currency) => {
    const html = renderToStaticMarkup(<EditorialGuides market={city} />);
    const href = html.match(/href="([^"]*\/tools\/property-scenario[^\"]*)"/)?.[1];
    expect(href).toBeDefined();
    const url = new URL(href!.replaceAll('&amp;', '&'), 'https://signedprice.com');
    expect(parsePropertyScenarioContext(Object.fromEntries(url.searchParams))).toMatchObject({ market, currency });
  });
  it('does not offer an unsupported Tokyo calculator', () => {
    expect(renderToStaticMarkup(<EditorialGuides market="tokyo" />)).not.toContain('/tools/property-scenario');
  });
});
