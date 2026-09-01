import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import Home from '../app/page';

describe('signedprice Evidence Editorial homepage', () => {
  it('uses one decision headline before the evidence and deeper product sections', async () => {
    const markup = renderToStaticMarkup(await Home());
    const h1s = markup.match(/<h1/g) ?? [];
    const sections = ['home-decision', 'home-evidence', 'home-paths', 'home-explore', 'home-briefs', 'home-trust'];
    const positions = sections.map((id) => markup.indexOf(`id="${id}"`));

    expect(h1s).toHaveLength(1);
    expect(markup).toContain('<h1 id="home-headline">See what homes actually signed for.</h1>');
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('renders three connected city tabs with Seoul selected initially', async () => {
    const markup = renderToStaticMarkup(await Home());
    const tabs = markup.match(/<button[^>]+role="tab"[^>]+aria-selected="(?:true|false)"/g) ?? [];

    expect(tabs).toHaveLength(3);
    expect(markup).toContain('id="market-tab-seoul" role="tab" aria-selected="true"');
    expect(markup).toContain('id="market-tab-singapore" role="tab" aria-selected="false"');
    expect(markup).toContain('id="market-tab-dubai" role="tab" aria-selected="false"');
    expect(tabs.filter((tab) => tab.includes('aria-selected="true"'))).toHaveLength(1);
  });

  it('keeps the four primary product destinations in the shared header', async () => {
    const markup = renderToStaticMarkup(await Home());
    const navigation = markup.match(/<nav aria-label="Primary navigation">([\s\S]*?)<\/nav>/)?.[1] ?? '';

    expect(navigation.match(/<a /g) ?? []).toHaveLength(4);
    expect(navigation).toContain('href="/kr/seoul/check">Check</a>');
    expect(navigation).toContain('href="/kr/seoul/explore">Explore</a>');
    expect(navigation).toContain('href="/kr/seoul/news">Briefs</a>');
    expect(navigation).toContain('href="/kr/seoul/guide">Guide</a>');
  });

  it('keeps all six market slots while moving decisions to the hero', async () => {
    const markup = renderToStaticMarkup(await Home());
    const seoulPanel = markup.slice(
      markup.indexOf('id="market-panel-seoul"'),
      markup.indexOf('id="market-panel-singapore"'),
    );

    for (const label of ['Check', 'Explore', 'Rankings', 'News', 'Guide', 'Community']) {
      expect(seoulPanel).toContain(`>${label}</strong>`);
    }
    expect(markup).toContain('aria-label="Choose a property decision"');
    expect(markup).toContain('aria-pressed="true">Rent</button>');
  });

  it('keeps unavailable market content visible without dead market links', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('Verified Singapore evidence unavailable');
    expect(markup).toContain('DLD and RERA display-rights clearance is incomplete.');
    expect(markup).not.toMatch(/href="\/(?:sg|ae)\//);
  });

  it('closes with a compact trust boundary instead of filler principles', async () => {
    const markup = renderToStaticMarkup(await Home());

    expect(markup).toContain('id="home-trust"');
    expect(markup).toContain('SignedPrice does not turn missing evidence into confident claims.');
    expect(markup).toContain('>Rights disclosed</span>');
    expect(markup).toContain('>Human-approved briefs</span>');
    expect(markup).not.toContain('class="principles site-shell"');
  });
});
