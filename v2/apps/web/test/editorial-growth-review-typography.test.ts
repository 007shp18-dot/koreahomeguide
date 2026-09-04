import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(
  new URL('../components/design-review/editorial-growth-review.module.css', import.meta.url),
  'utf8',
);

describe('editorial growth typography contract', () => {
  it('declares the approved type and frame tokens', () => {
    for (const declaration of [
      '--review-display: 56px',
      '--review-h2: 36px',
      '--review-h3: 24px',
      '--review-lead: 20px',
      '--review-article: 18px',
      '--review-ui: 16px',
      '--review-control: 14px',
      '--review-meta: 12px',
      '--review-content-frame: 1200px',
      '--review-reading-frame: 720px',
      '--review-explore-rail: 420px',
    ]) {
      expect(css).toContain(declaration);
    }
  });

  it('rejects AI-template decoration and unreadable text', () => {
    const authoredFontSizes = [...css.matchAll(/(?:^|[;{])\s*font-size:\s*([^;}]*)/gm)]
      .map((match) => match[1]!.trim());

    expect(new Set(authoredFontSizes)).toEqual(new Set([
      'var(--review-display)',
      'var(--review-h2)',
      'var(--review-h3)',
      'var(--review-lead)',
      'var(--review-article)',
      'var(--review-ui)',
      'var(--review-control)',
      'var(--review-meta)',
    ]));
    expect(css).not.toMatch(/linear-gradient|radial-gradient|backdrop-filter/);
    expect(css).not.toMatch(/letter-spacing:\s*-(?:0\.0[3-9]|0\.[1-9])em/);
    expect(css).not.toMatch(/border-radius:\s*(?:[1-7]|9|1[013-9]|[2-9][0-9]+)px/);
  });

  it('uses zero default tracking and generous body leading for Chinese', () => {
    expect(css).toMatch(/\[data-review-locale='zh-CN'\][^{]*\{[^}]*letter-spacing:\s*0/);
    expect(css).toMatch(/\[data-review-locale='zh-CN'\][\s\S]*?line-height:\s*1\.(?:6[5-9]|[7-9][0-9])/);
    expect(css).toMatch(
      /\[data-review-locale='zh-CN'\][^{]*\{[^}]*--review-display-tracking:\s*0[^}]*--review-heading-tracking:\s*0/,
    );
  });

  it('uses a dense editorial result list and a bounded desktop hero', () => {
    expect(css).toMatch(/\.homeHero\s*\{[^}]*min-height:\s*520px/);
    expect(css).toMatch(/\.checkMetrics\s*\{[^}]*grid-template-columns:\s*1fr/);
  });

  it('keeps the market tool rail inside the editorial column at desktop widths', () => {
    expect(css).toMatch(/\.marketIndex li\s*\{[^}]*grid-template-columns:\s*40px minmax\(120px, 0\.7fr\) minmax\(150px, 1\.1fr\) minmax\(0, 0\.9fr\)/);
    expect(css).toMatch(/\.marketIndex nav\s*\{[^}]*gap:\s*var\(--review-space-2\) var\(--review-space-3\)/);
  });
});
