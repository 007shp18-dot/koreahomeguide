import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AreaExplorerViewSwitcher } from '../components/public-market/area-explorer-view-switcher';

describe('Explore view navigation', () => {
  it('keeps the selected advanced view visible when opening a shared table URL', () => {
    const html = renderToStaticMarkup(<AreaExplorerViewSwitcher current="table" locale="en" hrefFor={(view) => `/explore/?district=mapo-gu&view=${view}`} />);
    expect(html).toMatch(/<summary[^>]*>Table<svg[^>]*aria-hidden="true"[^>]*data-ui-icon="chevron-down"/);
    expect(html).toContain('aria-current="page" href="/explore?district=mapo-gu&amp;view=table"');
    expect(html).toContain('href="/explore?district=mapo-gu&amp;view=list"');
    expect(html).toContain('href="/explore?district=mapo-gu&amp;view=map"');
  });
});
