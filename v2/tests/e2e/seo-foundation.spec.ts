import { expect, test } from '@playwright/test';
import { editorialAlternates } from './public-route-contract';
import { NEIGHBOURHOOD_STORIES, neighbourhoodHref } from '../../apps/web/content/neighbourhood-stories';

function decodeEntities(value: string): string {
  const named: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };
  // Decode serialized XML/HTML once; URL percent escapes remain untouched.
  return value.replace(/&(amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, (entity, name: string) => {
    if (!name.startsWith('#')) return named[name.toLowerCase()]!;
    const hex = name[1]?.toLowerCase() === 'x';
    const codePoint = Number.parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
    return codePoint > 0 && codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff)
      ? String.fromCodePoint(codePoint)
      : entity;
  });
}

function sitemapLocations(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeEntities(match[1]!));
}

function requestPath(url: string): string {
  const parsed = new URL(url);
  return `${parsed.pathname}${parsed.search}`;
}

function linkTags(html: string, rel: string): string[] {
  return [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => new RegExp(`\\brel=["']${rel}["']`, 'i').test(tag));
}

function attribute(tag: string, name: string): string | undefined {
  const value = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
  return value === undefined ? undefined : decodeEntities(value);
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

test('SEO helpers: encoded URLs preserve their complete query and decode only once', () => {
  const url = 'https://www.signedprice.com/living/?market=kr-seoul&profile=kr-acro-river-park';
  const escaped = url.replaceAll('&', '&amp;');
  const decimal = url.replaceAll('&', '&#38;');
  const hexadecimal = url.replaceAll('&', '&#x26;');
  expect(sitemapLocations(`<urlset><loc>${escaped}</loc><loc>${decimal}</loc><loc>${hexadecimal}</loc></urlset>`))
    .toEqual([url, url, url]);
  expect(requestPath(url)).toBe('/living/?market=kr-seoul&profile=kr-acro-river-park');
  expect(requestPath('https://www.signedprice.com/ko/living/?profile=sg-marina-one-residences&note=R%26D'))
    .toBe('/ko/living/?profile=sg-marina-one-residences&note=R%26D');
  expect(canonicalFrom(`<link rel="canonical" href="${escaped}"/>`)).toBe(url);
  expect(alternatesFrom(`<link rel='alternate' hreflang='en' href='${hexadecimal}'/>`).get('en')).toBe(url);
  expect(metaContent(`<meta property="og:url" content="${decimal}"/>`, 'property', 'og:url')).toBe(url);
  expect(attribute('<meta content="Buyer\'s &quot;home&quot; &apos;visit&apos; &lt;1km&gt;"/>', 'content'))
    .toBe('Buyer\'s "home" \'visit\' <1km>');
  expect(decodeEntities('&amp;amp; &#x1F3E0; &#x110000; &#xD800; &unknown;'))
    .toBe('&amp; 🏠 &#x110000; &#xD800; &unknown;');
});

test('SEO foundation: every sitemap URL is terminal, indexable, and self-canonical', async ({ request }) => {
  const sitemapResponse = await request.get('/sitemap.xml', { maxRedirects: 0 });
  expect(sitemapResponse.status()).toBe(200);
  const locations = sitemapLocations(await sitemapResponse.text());

  expect(locations.length).toBeGreaterThan(0);
  expect(new Set(locations).size).toBe(locations.length);
  expect(locations).toContain('https://www.signedprice.com/sg/');
  expect(locations).toContain('https://www.signedprice.com/news/policy/');
  expect(locations).toContain('https://www.signedprice.com/news/policy/singapore-absd-policy-status/');
  expect(locations).toContain('https://www.signedprice.com/guides/read-seoul-sale-transactions/');
  expect(locations).not.toContain('https://www.signedprice.com/news/seoul-district-price-distribution/');
  expect(locations).toContain('https://www.signedprice.com/zh-cn/news/');
  expect(locations).toContain('https://www.signedprice.com/zh-cn/guides/');
  expect(locations.some((url) => url.startsWith('https://www.signedprice.com/insights/'))).toBe(false);

  for (const url of locations) {
    const parsed = new URL(url);
    expect(parsed.origin, url).toBe('https://www.signedprice.com');

    const response = await request.get(requestPath(url), { maxRedirects: 0 });
    expect(response.status(), url).toBe(200);
    const html = await response.text();
    expect(canonicalFrom(html), url).toBe(url);
    expect(html, url).toMatch(/<meta\s+name="robots"\s+content="index, follow"/i);
    const korean = parsed.pathname.startsWith('/ko/');
    const chinese = parsed.pathname.startsWith('/zh-cn/');
    expect(metaContent(html, 'property', 'og:url'), url).toBe(url);
    expect(metaContent(html, 'property', 'og:locale'), url).toBe(korean ? 'ko_KR' : chinese ? 'zh_CN' : 'en_US');
    const neighbourhood = NEIGHBOURHOOD_STORIES.find((story) => neighbourhoodHref(story.slug) === parsed.pathname.replace(/^\/ko(?=\/)/, ''));
    const expectedImage = neighbourhood
      ? new URL(neighbourhood.hero.src, parsed.origin).href
      : 'https://www.signedprice.com/og.png';
    expect(metaContent(html, 'property', 'og:image'), url).toBe(expectedImage);
    expect(metaContent(html, 'name', 'twitter:card'), url).toBe('summary_large_image');
    expect(metaContent(html, 'name', 'twitter:image'), url).toBe(expectedImage);
  }
});

test('SEO foundation: every English and Korean alternate links back', async ({ request }) => {
  const sitemapResponse = await request.get('/sitemap.xml');
  const locations = sitemapLocations(await sitemapResponse.text());

  for (const sourceUrl of locations) {
    const sourceResponse = await request.get(requestPath(sourceUrl));
    const sourceHtml = await sourceResponse.text();
    const sourceCanonical = canonicalFrom(sourceHtml);
    const sourceAlternates = alternatesFrom(sourceHtml);
    const pathname = new URL(sourceUrl).pathname;
    const sourceLanguage = pathname.startsWith('/ko/') ? 'ko' : pathname.startsWith('/zh-cn/') ? 'zh-Hans' : 'en';
    const counterpartLanguage = sourceLanguage === 'en'
      ? sourceAlternates.has('ko') ? 'ko' : sourceAlternates.has('zh-Hans') ? 'zh-Hans' : null
      : 'en';
    if (counterpartLanguage === null) continue;
    const counterpartUrl = sourceAlternates.get(counterpartLanguage);
    if (counterpartUrl === undefined) continue;

    const counterpartResponse = await request.get(requestPath(counterpartUrl), {
      maxRedirects: 0,
    });
    expect(counterpartResponse.status(), counterpartUrl).toBe(200);
    const counterpartAlternates = alternatesFrom(await counterpartResponse.text());
    expect(counterpartAlternates.get(sourceLanguage), counterpartUrl).toBe(sourceCanonical);
  }
});

test('SEO foundation: every reviewed editorial locale is reciprocal', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  test.setTimeout(120_000);

  for (const [path, expected] of Object.entries(editorialAlternates)) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const canonical = `https://www.signedprice.com${path}`;
    expect(canonicalFrom(html), path).toBe(canonical);
    const actual = alternatesFrom(html);
    expect(Object.fromEntries(actual), path).toEqual(Object.fromEntries(
      Object.entries(expected).map(([language, href]) => [
        language,
        `https://www.signedprice.com${href}`,
      ]),
    ));
  }
});
