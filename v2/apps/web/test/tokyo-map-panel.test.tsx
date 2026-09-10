import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const read = vi.hoisted(() => vi.fn().mockResolvedValue([]));
vi.mock('../lib/japan/area-map-summary.server', () => ({ readTokyoAreaMapSummary: read }));
vi.mock('../lib/maps/google-maps-browser-key.server', () => ({ googleMapsBrowserKeyFromEnvironment: () => null }));
import { TokyoMapPanel } from '../components/japan/tokyo-map-panel';

describe('Tokyo neighbourhood discovery', () => {
  it('keeps sibling areas available while a neighbourhood is selected and preserves property filters', async () => {
    const filters = { q: 'Ebisu', type: 'Pre-owned Condominiums, etc.', minArea: 50, maxArea: 90 };
    const panel = await TokyoMapPanel({ city: '13113', year: '2025', quarter: '4', filters });
    expect(read).toHaveBeenLastCalledWith('13113', '2025', '4', { ...filters, q: '' });
    expect(panel.props.filters).toEqual(filters);
  });
});
