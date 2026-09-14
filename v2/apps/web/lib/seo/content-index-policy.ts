// Keep these pages accessible while their public content is being developed.
// Reconsider each exclusion after the page has substantive, useful content.
const excludedPaths = new Set([
  '/community/',
  '/zh-cn/guides/wolse-vs-jeonse-zh/',
  '/zh-cn/guides/buy-property-in-korea-zh/',
  '/zh-cn/guides/rent-in-korea-zh/',
]);

export function isContentIndexable(pathOrUrl: string): boolean {
  const path = new URL(pathOrUrl, 'https://www.signedprice.com').pathname;
  return !excludedPaths.has(path.endsWith('/') ? path : `${path}/`);
}

export function indexableLanguageAlternates(languages: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(languages).filter(([, url]) => isContentIndexable(url)));
}
