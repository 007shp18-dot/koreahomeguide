import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { GET } from '../app/app-manifest/[locale]/route';
import { MobileAppProvider } from '../components/mobile-app/mobile-app-provider';
import { InstallAppCard } from '../components/mobile-app/install-app-card';

vi.mock('next/navigation', () => ({ usePathname: () => '/saved/' }));

describe('mobile app integration', () => {
  it('serves a Korean manifest as a manifest document and rejects unknown languages', async () => {
    const response = await GET(new Request('https://example.test/app-manifest/ko/'), { params: Promise.resolve({ locale: 'ko' }) });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/manifest+json');
    expect((await response.json()).start_url).toBe('/ko/prices/');
    const invalid = await GET(new Request('https://example.test/app-manifest/fr/'), { params: Promise.resolve({ locale: 'fr' }) });
    expect(invalid.status).toBe(404);
  });
  it.each([
    ['en', 'How to install', '/saved/'],
    ['ko', '설치 방법', '/ko/saved/'],
    ['zh-CN', '安装方法', '/zh-cn/saved/'],
  ] as const)('renders usable manual installation guidance in %s without browser APIs', (locale, instructions, savedHref) => {
    const html = renderToStaticMarkup(<MobileAppProvider locale={locale}><InstallAppCard locale={locale} /></MobileAppProvider>);
    expect(html).toContain(instructions);
    expect(html).toContain('Safari');
    expect(html).toMatch(new RegExp(`href="${savedHref.replace(/\/$/, '')}/?"`));
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('<button');
  });
});
