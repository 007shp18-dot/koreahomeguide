import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  MarketDetailShell,
  MarketExploreShell,
  MarketLayerControl,
} from '../components/market-ui/market-shell';

describe('shared market composition', () => {
  it('keeps Explore information order and one active market layer', () => {
    const html = renderToStaticMarkup(<MarketExploreShell
      eyebrow="Singapore Explore"
      title="Residential transaction evidence"
      period={<span>2026-02–2026-08</span>}
      layers={<MarketLayerControl label="Market layers" items={[
        { id: 'private', label: 'Private', href: '#private', current: true },
        { id: 'resale', label: 'HDB resale', href: '#resale' },
      ]} />}
      discovery={<p>Discovery</p>}
      spatial={<p>Map</p>}
    />);

    expect(html).toContain('data-market-explore-shell="true"');
    expect(html.indexOf('Residential transaction evidence')).toBeLessThan(html.indexOf('Market layers'));
    expect(html.indexOf('Discovery')).toBeLessThan(html.indexOf('Map'));
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it('keeps Detail evidence before its contextual rail', () => {
    const html = renderToStaticMarkup(<MarketDetailShell
      breadcrumb={<nav>Explore / Building</nav>}
      identity={<h1>Evidence Tower</h1>}
      metric={<strong>₩720M</strong>}
      evidence={<p>Reported contracts</p>}
      rail={<aside>Sources</aside>}
    />);

    expect(html).toContain('data-market-detail-shell="true"');
    expect(html.indexOf('Reported contracts')).toBeLessThan(html.indexOf('Sources'));
  });

  it('owns archive geometry and mobile stacking in one stylesheet', () => {
    const css = readFileSync(new URL('../components/market-ui/market-shell.module.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.detail\s*\{[^}]*width:\s*min\(1180px,\s*calc\(100% - 40px\)\)/);
    expect(css).toMatch(/grid-template-columns:\s*420px minmax\(0, 1fr\)/);
    expect(css).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) 300px/);
    expect(css).toMatch(/min-height:\s*44px/);
    expect(css).toMatch(/@media \(max-width:\s*760px\)[\s\S]*grid-template-columns:\s*1fr/);
    expect(css).toMatch(/box-shadow:\s*0 10px 28px/);
  });
});
