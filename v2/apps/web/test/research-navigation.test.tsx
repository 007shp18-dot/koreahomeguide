import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { EditorialGrowthPublicFrame } from '../components/editorial-growth/editorial-growth-public-shell';
import { NewsroomIndex, resolveNewsroomFilters } from '../components/newsroom/newsroom-index';

describe('research navigation continuity', () => {
  it('uses the global market header on News instead of a separate editorial header', () => {
    const html = renderToStaticMarkup(<EditorialGrowthPublicFrame locale="en" surface="content"><main>News</main></EditorialGrowthPublicFrame>);
    expect(html).toContain('class="site-header"');
    expect(html).toContain('data-navigation-tier="global"');
    expect(html).toContain('aria-label="Market navigation"');
  });
  it('keeps external headlines reachable from the News index', () => {
    const filters = resolveNewsroomFilters({ type: 'headlines', market: 'singapore' });
    expect(filters.canonicalHref).toBe('/news/?type=headlines&market=singapore');
    const html = renderToStaticMarkup(<NewsroomIndex articles={[]} policies={[]} filters={filters} />);
    expect(html).toContain('External headlines');
    expect(html).not.toContain('No articles match');
  });
});
