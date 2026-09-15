import { describe, expect, it } from 'vitest';
import { defaultPanelBand, panelJeonseRatio, panelSpread } from '../lib/brief/panel-statistics';
const summary = { count: 8, median: 100, q1: 90, q3: 110 };
describe('building panel evidence', () => {
  it('selects complete-cohort counts, resolves ties and retains an explicit area', () => {
    const rows = [{ band: 'under-40', count: 12 }, { band: '60-85', count: 12 }, { band: 'all', count: 40 }];
    expect(defaultPanelBand(rows)).toBe('60-85');
    expect(defaultPanelBand(rows, 'under-40')).toBe('under-40');
    expect(defaultPanelBand(rows, 'all')).toBe('all');
    expect(defaultPanelBand([{ band: '40-60', count: 4 }])).toBe('all');
  });
  it('withholds ratios for small groups and mismatched periods', () => {
    expect(panelJeonseRatio(summary, { ...summary, median: 50, q1: 40, q3: 60 }, '2026-07', '2026-07')).toBe(.5);
    expect(panelJeonseRatio(summary, { ...summary, count: 4 }, '2026-07', '2026-07')).toBeNull();
    expect(panelJeonseRatio(summary, summary, '2026-07', '2026-06')).toBeNull();
  });
  it('uses the middle half and omits invalid evidence', () => {
    expect(panelSpread(summary)).toEqual({ variant: 'wide', percent: 20 });
    expect(panelSpread({ ...summary, q1: 98, q3: 102 })?.variant).toBe('narrow');
    expect(panelSpread({ ...summary, count: 3 })).toBeNull();
  });
});
