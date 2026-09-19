import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { PropertyScenarioCalculator } from '../components/market-ui/property-scenario';
import { PropertyScenarioWorkspace } from '../components/tools/property-scenario-workspace';
import { parsePropertyScenarioContext } from '../lib/tools/property-scenario-context';

it('shows purchase outlay before rental assumptions exist without inventing a yield', () => {
  const html = renderToStaticMarkup(<PropertyScenarioCalculator currency="SGD" price={1_000_000} />);
  // Existing default buyer profile: 24,600 BSD + 600,000 ABSD, plus purchase price.
  expect(html).toContain('1,624,600');
  expect(html).toContain('Total acquisition outlay');
  expect(html).not.toContain('Operating yield on total cost</dt>');
  expect(html).toMatch(/id="[^"]+-annualCosts"[^>]*value=""/);
});

it('identifies an invalid zero purchase price instead of calling it missing rent', () => {
  const html = renderToStaticMarkup(<PropertyScenarioCalculator currency="SGD" price={0} />);
  expect(html).toMatch(/id="[^"]+-price"[^>]*aria-invalid="true"/);
  expect(html).toContain('Enter a purchase price greater than 0');
});

it.each([
  ['ko', 'ae-dubai', 'AED', '/ko/guides?market=dubai'],
  ['zh-CN', 'jp-tokyo', 'JPY', '/zh-cn/guides?market=tokyo'],
  ['en', 'sg-singapore', 'SGD', '/guides?market=singapore'],
] as const)('keeps %s calculator city context when opening guides', (locale, market, currency, href) => {
  const html = renderToStaticMarkup(<PropertyScenarioWorkspace locale={locale} context={parsePropertyScenarioContext({ market, currency }, locale)} />);
  expect(html).toContain(`href="${href}"`);
});
