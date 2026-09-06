import { describe, expect, it } from 'vitest';
import { buildSingaporeMapCoverage } from '../lib/singapore/map-coverage';

describe('Singapore complete-result map coverage', () => {
  it('accounts for results beyond the first page without geocoding thousands of projects', () => {
    const projects = Array.from({ length: 775 }, (_, i) => ({ id: String(i), name: `Project ${i}`,
      street: 'Example Road', district: '01', segment: 'CCR' as const,
      location: i < 3 ? { latitude: 1.28 + i * .001, longitude: 103.85 } : null,
    }));
    const coverage = buildSingaporeMapCoverage(projects, projects, null);
    expect(coverage.total).toBe(775);
    expect(coverage.located).toBe(3);
    expect(coverage.areaOnly).toBe(772);
    expect(coverage.unplaced).toBe(0);
    expect(coverage.points.reduce((n, p) => n + (p.count ?? 1), 0)).toBe(775);
    expect(coverage.points.some((p) => p.address !== undefined)).toBe(false);
    expect(coverage.points.find((p) => p.kind === 'area')?.title).toContain('District 01');
  });

  it('does not borrow another district location and retains a count when no anchor is known', () => {
    const missing = { id: 'missing', name: 'Missing', street: '', district: '28', segment: 'OCR' as const, location: null };
    const known = { ...missing, id: 'known', district: '01', location: { latitude: 1.28, longitude: 103.85 } };
    const coverage = buildSingaporeMapCoverage([missing], [known], null);
    expect(coverage.points).toEqual([]);
    expect(coverage.unplaced).toBe(1);
    expect(coverage.unplacedGroups).toEqual([{ district: '28', count: 1 }]);
  });
});
