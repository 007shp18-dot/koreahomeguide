import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AppliedFilterButtons } from '../components/market-ui/applied-filters';

describe('state-backed applied filters', () => {
  it('gives each condition its own named removal and keeps clear separate', () => {
    const removeQuery = vi.fn();
    const removeDistrict = vi.fn();
    const clear = vi.fn();
    const element = AppliedFilterButtons({
      items: [{ id: 'q', label: 'Orchard', onRemove: removeQuery }, { id: 'district', label: 'District 09', onRemove: removeDistrict }],
      label: 'Applied filters', removeLabel: 'Remove filter', clearLabel: 'Clear filters', onClear: clear,
    })!;
    const html = renderToStaticMarkup(element);
    expect(html).toContain('aria-label="Remove filter: Orchard"');
    expect(html).toContain('aria-label="Remove filter: District 09"');
    expect(html.match(/type="button"/g)).toHaveLength(3);
    const [conditions, reset] = element.props.children;
    conditions[0].props.onClick();
    expect(removeQuery).toHaveBeenCalledOnce();
    expect(removeDistrict).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
    reset.props.onClick();
    expect(clear).toHaveBeenCalledOnce();
  });

  it('omits the empty filter navigation', () => {
    expect(AppliedFilterButtons({ items: [], label: 'Applied filters', removeLabel: 'Remove filter', clearLabel: 'Clear filters', onClear: vi.fn() })).toBeNull();
  });
});
