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
    ['check', '/kr/'],
    ['explore', '/kr/seoul/explore/'],
  ] as const)('marks only the %s destination as current', (current, currentHref) => {
    const html = renderToStaticMarkup(<PublicSectionTabs current={current} />);

    expect(anchorFor(html, '/kr/')).not.toBe('');
    expect(anchorFor(html, '/kr/seoul/explore/')).not.toBe('');
    expect(anchorFor(html, currentHref)).toContain('aria-current="page"');
    expect((html.match(/aria-current="page"/g) ?? [])).toHaveLength(1);
    expect((html.match(/<a\b/g) ?? [])).toHaveLength(2);
  });

  it('labels News and Guide as non-interactive future states', () => {
    const html = renderToStaticMarkup(<PublicSectionTabs current="explore" />);

    expect(html).toMatch(/data-public-tab="news"[^>]*aria-disabled="true"/);
    expect(html).toMatch(/data-public-tab="guide"[^>]*aria-disabled="true"/);
    expect(html).toContain('Future');
    expect(html).not.toMatch(/<a\b[^>]*>[^<]*(?:News|Guide)/);
  });

  it('keeps interactive tabs at least 44px with a visible focus ring', () => {
    const rule = css.match(/\.publicSectionTabLink\s*\{([^}]*)\}/)?.[1] ?? '';
    const minimumHeight = Number(rule.match(/min-height:\s*(\d+)px/)?.[1]);

    expect(minimumHeight).toBeGreaterThanOrEqual(44);
    expect(css).toMatch(/\.publicSectionTabLink:focus-visible\s*\{[\s\S]*?outline:\s*2px[\s\S]*?outline-offset:\s*2px/);
  });
});
