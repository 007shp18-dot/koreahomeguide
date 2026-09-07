import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../components/site-header', () => ({ SiteHeader: () => null }));
vi.mock('../components/site-footer', () => ({ SiteFooter: () => null }));
import KoreanHome from '../app/(ko)/ko/page';
import KoreanContact from '../app/(ko)/ko/contact/page';
import { languageDestinations } from '../lib/navigation/site-navigation';

describe('Korean entry routes', () => {
  it('offers three cities and labels untranslated tools', () => {
    const html = renderToStaticMarkup(<KoreanHome />);
    for (const path of ['/ko/kr/seoul', '/ko/sg', '/ko/ae/dubai', '/ko/contact']) expect(html).toMatch(new RegExp(`href="${path}/?"`));
    expect(html).toContain('실거래 탐색');
    expect(html).toContain('(영문)');
    expect(html).toContain('/ko/passport/');
  });
  it('opens three email drafts without posting or requiring financial documents', () => {
    const html = renderToStaticMarkup(<KoreanContact />);
    for (const city of ['seoul', 'singapore', 'dubai']) expect(html).toContain(`id="research-${city}"`);
    expect(html.match(/subject=/g)).toHaveLength(3);
    expect(html).not.toContain('<form');
    expect(html).toContain('직접 전송하기 전에는');
  });
  it('switches only published Korean surfaces and preserves queries', () => {
    expect(languageDestinations('/').ko).toBe('/ko/');
    expect(languageDestinations('/ko/').en).toBe('/');
    expect(languageDestinations('/sg/', '?from=home').ko).toBe('/ko/sg/?from=home');
    expect(languageDestinations('/ko/ae/dubai/').en).toBe('/ae/dubai/');
    expect(languageDestinations('/contact/').ko).toBe('/ko/contact/');
    expect(languageDestinations('/ae/dubai/check/').ko).toBeNull();
  });
});
