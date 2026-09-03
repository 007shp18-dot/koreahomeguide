import { expect, test } from '@playwright/test';

function sitemapLocations(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
}

function linkTags(html: string, rel: string): string[] {
  return [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => new RegExp(`\\brel=["']${rel}["']`, 'i').test(tag));
}

function attribute(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1];
}

function canonicalFrom(html: string): string | undefined {
  const canonical = linkTags(html, 'canonical');
  return canonical.length === 1 ? attribute(canonical[0]!, 'href') : undefined;
}

function alternatesFrom(html: string): ReadonlyMap<string, string> {
  return new Map(linkTags(html, 'alternate').flatMap((tag) => {
    const language = attribute(tag, 'hreflang');
    const href = attribute(tag, 'href');
    return language && href ? [[language, href] as const] : [];
  }));
}

function metaContent(html: string, key: 'name' | 'property', value: string): string | undefined {
  const tag = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => match[0])
    .find((candidate) => attribute(candidate, key)?.toLowerCase() === value.toLowerCase());
  return tag === undefined ? undefined : attribute(tag, 'content');
}

test('SEO foundation: every sitemap URL is terminal, indexable, and self-canonical', async ({ request }) => {
  const sitemapResponse = await request.get('/sitemap.xml', { maxRedirects: 0 });
  expect(sitemapResponse.status()).toBe(200);
  const locations = sitemapLocations(await sitemapResponse.text());

  expect(locations.length).toBeGreaterThan(0);
  expect(new Set(locations).size).toBe(locations.length);
  expect(locations.some((url) => new URL(url).pathname.startsWith('/sg/'))).toBe(false);

  for (const url of locations) {
    const parsed = new URL(url);
    expect(parsed.origin, url).toBe('https://www.signedprice.com');

    const response = await request.get(parsed.pathname, { maxRedirects: 0 });
    expect(response.status(), url).toBe(200);
    const html = await response.text();
    expect(canonicalFrom(html), url).toBe(url);
    expect(html, url).toMatch(/<meta\s+name="robots"\s+content="index, follow"/i);
    const korean = parsed.pathname.startsWith('/ko/');
    expect(metaContent(html, 'property', 'og:url'), url).toBe(url);
    expect(metaContent(html, 'property', 'og:locale'), url).toBe(korean ? 'ko_KR' : 'en_US');
    expect(metaContent(html, 'property', 'og:image'), url).toBe(
      `https://www.signedprice.com/og/${korean ? 'ko' : 'en'}/`,
    );
    expect(metaContent(html, 'name', 'twitter:card'), url).toBe('summary_large_image');
    expect(metaContent(html, 'name', 'twitter:image'), url).toBe(
      `https://www.signedprice.com/og/${korean ? 'ko' : 'en'}/`,
    );
  }
});

test('SEO foundation: every English and Korean alternate links back', async ({ request }) => {
  const sitemapResponse = await request.get('/sitemap.xml');
  const locations = sitemapLocations(await sitemapResponse.text());

  for (const sourceUrl of locations) {
    const sourceResponse = await request.get(new URL(sourceUrl).pathname);
    const sourceHtml = await sourceResponse.text();
    const sourceCanonical = canonicalFrom(sourceHtml);
    const sourceAlternates = alternatesFrom(sourceHtml);
    const sourceLanguage = new URL(sourceUrl).pathname.startsWith('/ko/') ? 'ko' : 'en';
    const counterpartLanguage = sourceLanguage === 'ko' ? 'en' : 'ko';
    const counterpartUrl = sourceAlternates.get(counterpartLanguage);
    if (counterpartUrl === undefined) continue;

    const counterpartResponse = await request.get(new URL(counterpartUrl).pathname, {
      maxRedirects: 0,
    });
    expect(counterpartResponse.status(), counterpartUrl).toBe(200);
    const counterpartAlternates = alternatesFrom(await counterpartResponse.text());
    expect(counterpartAlternates.get(sourceLanguage), counterpartUrl).toBe(sourceCanonical);
  }
});
