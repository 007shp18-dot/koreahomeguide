import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EvidenceSectionHeading } from '../components/evidence-ui/section-heading';
import { SegmentedControl } from '../components/evidence-ui/segmented-control';

describe('shared evidence UI', () => {
  it('marks exactly one current item in a labeled segmented navigation', () => {
    const markup = renderToStaticMarkup(createElement(SegmentedControl, {
      label: 'Explorer view',
      value: 'split',
      items: [
        { value: 'list', label: 'List', href: '/kr/seoul/explore/?view=list' },
        { value: 'split', label: 'Split', href: '/kr/seoul/explore/' },
      ],
    }));

    expect(markup).toContain('aria-label="Explorer view"');
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
    expect(markup).toContain(
      '<a aria-current="page" href="/kr/seoul/explore">Split</a>',
    );
    expect(markup).toContain('href="/kr/seoul/explore?view=list"');
  });

  it('keeps eyebrow, title, and optional source in the shared reading order', () => {
    const markup = renderToStaticMarkup(createElement(EvidenceSectionHeading, {
      eyebrow: '01 / Evidence',
      title: 'Reported contracts',
      source: 'MOLIT',
    }));

    expect(markup.indexOf('01 / Evidence')).toBeLessThan(markup.indexOf('Reported contracts'));
    expect(markup.indexOf('Reported contracts')).toBeLessThan(markup.indexOf('MOLIT'));
    expect(markup).toMatch(/<header[^>]*>.*<p[^>]*>01 \/ Evidence<\/p>.*<h2[^>]*>Reported contracts<\/h2>.*<small[^>]*>MOLIT<\/small>.*<\/header>/);
  });

  it('omits an empty source instead of reserving a duplicate visual row', () => {
    const markup = renderToStaticMarkup(createElement(EvidenceSectionHeading, {
      eyebrow: '02 / Buildings',
      title: 'Observed buildings',
    }));

    expect(markup).not.toContain('<small');
    expect(markup).toContain('Observed buildings');
  });

  it('owns the section heading id used by detail aria labels', () => {
    const markup = renderToStaticMarkup(createElement(EvidenceSectionHeading, {
      eyebrow: '03 / Buildings',
      title: 'Verified buildings',
      id: 'verified-buildings-heading',
    }));

    expect(markup).toContain('<h2 id="verified-buildings-heading">Verified buildings</h2>');
  });
});
