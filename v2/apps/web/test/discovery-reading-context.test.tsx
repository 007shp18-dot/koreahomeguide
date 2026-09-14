import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { DiscoveryReading } from '../components/discovery/discovery-reading';

it.each(['en', 'ko', 'zh-CN'] as const)('links building readers to city research without implying an unrelated neighbourhood match in %s', locale => {
  const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
  const html = renderToStaticMarkup(<DiscoveryReading market="seoul" locale={locale} context="building" />);
  expect(html).toContain(`${prefix}/news?market=seoul`);
  expect(html).not.toContain('seochon');
  expect(html).not.toContain('/where');
});

it('preserves the neighbourhood stories on city discovery pages', () => {
  const html = renderToStaticMarkup(<DiscoveryReading market="seoul" />);
  expect(html).toContain('seochon');
  expect(html).toContain('Life and neighbourhoods in this city');
});
