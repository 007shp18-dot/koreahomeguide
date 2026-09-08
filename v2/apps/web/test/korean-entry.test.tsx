import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../components/site-header', () => ({ SiteHeader: () => null }));
vi.mock('../components/site-footer', () => ({ SiteFooter: () => null }));
import KoreanHome from '../app/(ko)/ko/page';
import KoreanContact from '../app/(ko)/ko/contact/page';
import { languageDestinations } from '../lib/navigation/site-navigation';

describe('Korean entry routes', () => {
  it('offers four cities and preserves Korean tools', () => {
    const html = renderToStaticMarkup(<KoreanHome />);
    for (const path of ['/ko/kr/seoul/explore', '/ko/sg/singapore/explore', '/ko/ae/dubai/explore', '/jp/tokyo']) expect(html).toMatch(new RegExp(`href="${path}/?"`));
    expect(html).toContain('도시 탐색');
    expect(html).not.toContain('(영문)');
    expect(html).toContain('/ko/sg/singapore/explore');
    expect(html).toContain('/ko/passport/');
  });
  it('opens three email drafts without posting or requiring financial documents', () => {
    const html = renderToStaticMarkup(<KoreanContact />);
    for (const city of ['seoul', 'singapore', 'dubai']) expect(html).toContain(`id="research-${city}"`);
    expect(html.match(/subject=/g)).toHaveLength(3);
    expect(html).not.toContain('<form');
    expect(html).toContain('직접 보내주세요');
  });
  it('switches only published Korean surfaces and preserves queries', () => {
    expect(languageDestinations('/').ko).toBe('/ko/');
    expect(languageDestinations('/ko/').en).toBe('/');
    expect(languageDestinations('/sg/', '?from=home').ko).toBe('/ko/sg/?from=home');
    expect(languageDestinations('/ko/ae/dubai/').en).toBe('/ae/dubai/');
    expect(languageDestinations('/contact/').ko).toBe('/ko/contact/');
    expect(languageDestinations('/ae/dubai/check/').ko).toBe('/ko/ae/dubai/check/');
  });
});
