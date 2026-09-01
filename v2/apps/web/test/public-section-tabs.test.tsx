import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PublicSectionTabs } from '../components/public-market/public-section-tabs';

const css = readFileSync(
  new URL('../components/public-market/public-market.module.css', import.meta.url),
  'utf8',
);

function anchorFor(html: string, href: string): string {
  const normalizedHref = href.endsWith('/') ? href.slice(0, -1) : href;
  return html.match(new RegExp(`<a\\b[^>]*href="${normalizedHref}/?"[^>]*>`))?.[0] ?? '';
}

describe('public evidence section tabs', () => {
  it.each([
    ['check', '/kr/seoul/check/'],
    ['explore', '/kr/seoul/explore/'],
    ['news', '/kr/seoul/news/'],
    ['guide', '/kr/seoul/guide/'],
  ] as const)('marks only the %s destination as current', (current, currentHref) => {
    const html = renderToStaticMarkup(<PublicSectionTabs current={current} />);

    expect(anchorFor(html, '/kr/seoul/check/')).not.toBe('');
    expect(anchorFor(html, '/kr/seoul/explore/')).not.toBe('');
    expect(anchorFor(html, '/kr/seoul/news/')).not.toBe('');
    expect(anchorFor(html, currentHref)).toContain('aria-current="page"');
    expect((html.match(/aria-current="page"/g) ?? [])).toHaveLength(1);
    expect(anchorFor(html, '/kr/seoul/guide/')).not.toBe('');
    expect((html.match(/<a\b/g) ?? [])).toHaveLength(4);
  });

  it('makes both News and Guide interactive', () => {
    const html = renderToStaticMarkup(<PublicSectionTabs current="explore" />);

    expect(html).toContain('data-public-tab="guide"');
    expect(html).toContain('href="/kr/seoul/guide"');
    expect(html).toContain('data-public-tab="news"');
    expect(html).toContain('href="/kr/seoul/news"');
    expect(html).not.toMatch(/aria-disabled="true"|>Future</);
  });

  it('keeps interactive tabs at least 44px with a visible focus ring', () => {
    const rule = css.match(/\.publicSectionTabLink\s*\{([^}]*)\}/)?.[1] ?? '';
    const minimumHeight = Number(rule.match(/min-height:\s*(\d+)px/)?.[1]);

    expect(minimumHeight).toBeGreaterThanOrEqual(44);
    expect(css).toMatch(/\.publicSectionTabLink:focus-visible\s*\{[\s\S]*?outline:\s*2px[\s\S]*?outline-offset:\s*2px/);
  });
});
