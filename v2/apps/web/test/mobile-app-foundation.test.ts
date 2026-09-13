import { describe, expect, it } from 'vitest';
import { mobileAppManifest, mobileAppNavigation, mobileAppMetadata } from '../lib/mobile-app/model';

describe('mobile app entry and navigation', () => {
  it('keeps one app identity while preserving the installation language', () => {
    for (const [locale, prefix] of [['en', ''], ['ko', '/ko'], ['zh-CN', '/zh-cn']] as const) {
      const manifest = mobileAppManifest(locale);
      expect(manifest.id).toBe('/');
      expect(manifest.start_url).toBe(`${prefix}/prices/`);
      expect(manifest.lang).toBe(locale);
      expect(manifest.display).toBe('standalone');
      expect(manifest.scope).toBe('/');
      expect(manifest.shortcuts?.map(item => item.url)).toEqual([`${prefix}/prices/`, `${prefix}/saved/`]);
      expect(mobileAppMetadata(locale).manifest).toBe(`/app-manifest/${locale}/`);
    }
  });
  it('opens the current city explorer without carrying a foreign building or filters', () => {
    const links = mobileAppNavigation('/ko/sg/singapore/explore/central/project-one/', 'ko');
    expect(links[0]).toMatchObject({ href: '/ko/sg/singapore/explore/', current: true });
    expect(links[1]).toMatchObject({ href: '/ko/saved/', current: false });
    expect(links).toHaveLength(4);
    expect(links.some(link => link.href.includes('community'))).toBe(false);
  });
  it('recognizes saved and calculation screens and never invents a Tokyo building route', () => {
    expect(mobileAppNavigation('/zh-cn/jp/tokyo/shortlist/', 'zh-CN')[1]?.current).toBe(true);
    expect(mobileAppNavigation('/zh-cn/jp/tokyo/shortlist/', 'zh-CN')[0]?.href).toBe('/zh-cn/jp/tokyo/explore/');
    expect(mobileAppNavigation('/kr/seoul/check/', 'en')[3]?.current).toBe(true);
    expect(mobileAppNavigation('/prices/', 'en')[0]?.href).toBe('/prices/');
    expect(mobileAppNavigation('/ko/sg/', 'ko')[0]?.href).toBe('/ko/sg/singapore/explore/');
  });
});
