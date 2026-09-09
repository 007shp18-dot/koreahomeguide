import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  MarketDetailShell,
  MarketExploreShell,
  MarketLayerControl,
} from '../components/market-ui/market-shell';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '../components/market-representative-photo';

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
    const overviewCss = readFileSync(new URL('../components/market-dashboard.module.css', import.meta.url), 'utf8');
    const photoCss = readFileSync(new URL('../components/market-representative-photo.module.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.detail\s*\{[^}]*width:[^;]*var\(--page-gutter\)[^;]*var\(--content-frame\)/);
    expect(css).toMatch(/grid-template-columns:\s*minmax\(320px, \.85fr\) minmax\(0, 1\.15fr\)/);
    expect(css).toMatch(/\.detailGrid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/);
    expect(overviewCss).toMatch(/\.hero[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    expect(photoCss).toMatch(/aspect-ratio:\s*16\s*\/\s*9/);
    expect(css).toMatch(/min-height:\s*44px/);
    expect(css).toMatch(/@media \(max-width:\s*760px\)[\s\S]*grid-template-columns:\s*1fr/);
    expect(css).toMatch(/\.identity[^}]*box-shadow:\s*none/);
  });

  it('keeps the representative-photo fallback in the same 16:9 frame', () => {
    const html = renderToStaticMarkup(<MarketRepresentativePhoto
      cityLabel="Seoul"
      photo={null}
    />);

    expect(html).toContain('data-building-media="market-context-fallback"');
    expect(html).toContain('Seoul market context');
    expect(html).toContain('No approved market photograph is available.');
  });

  it.each([
    ['city', '도시 전경'],
    ['property', '도시 참고 사진 · 해당 매물의 사진이 아닙니다'],
  ] as const)('localizes the %s photo caption without dropping the city or image', (context, caption) => {
    const html = renderToStaticMarkup(<MarketRepresentativePhoto photo={MARKET_PHOTOS.singapore} cityLabel="싱가포르" locale="ko" context={context} />);
    expect(html.match(/<figcaption[^>]*>(.*?)<\/figcaption>/)?.[1]).toBe(`싱가포르 · ${caption}`);
    expect(html).toContain('singapore-residential.jpg');
    expect(html).toContain('alt="High-rise residential architecture in Singapore"');
  });

  it('retains the English editorial disclaimer for callers without a locale', () => {
    const html = renderToStaticMarkup(<MarketRepresentativePhoto photo={MARKET_PHOTOS.dubai} cityLabel="Dubai" />);
    expect(html.match(/<figcaption[^>]*>(.*?)<\/figcaption>/)?.[1]).toBe('Dubai · Editorial city photograph · not this exact property');
  });

  it('localizes the missing-photo explanation and caption', () => {
    const html = renderToStaticMarkup(<MarketRepresentativePhoto photo={null} cityLabel="서울" locale="ko" />);
    expect(html).toContain('서울 주택 시장');
    expect(html).toContain('사용할 수 있는 도시 사진이 없습니다.');
    expect(html.match(/<figcaption[^>]*>(.*?)<\/figcaption>/)?.[1]).toBe('서울 · 지역 정보');
    expect(html).not.toContain('Verified market context');
  });
});
