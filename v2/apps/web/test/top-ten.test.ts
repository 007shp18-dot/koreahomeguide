import { describe, expect, it } from 'vitest';

import { rankDubaiProjects, rankTokyoTransactions } from '../lib/rankings/top-ten';

describe('top ten insight ranking', () => {
  it('ranks eligible Dubai projects by median transaction value and excludes small samples', () => {
    const rows = [
      { id: 'small', projectNumber: 'small', name: 'Small sample', areaSlug: 'x', housing: 'apartment', stage: 'ready', n: 29, medianPriceAed: 99_000_000, medianPricePerSqmAed: 1 },
      { id: 'b', projectNumber: 'b', name: 'B Project', areaSlug: 'x', housing: 'apartment', stage: 'off-plan', n: 30, medianPriceAed: 2_000_000, medianPricePerSqmAed: 20_000 },
      { id: 'a', projectNumber: 'a', name: 'A Project', areaSlug: 'x', housing: 'apartment', stage: 'ready', n: 31, medianPriceAed: 2_000_000, medianPricePerSqmAed: 19_000 },
      { id: 'c', projectNumber: 'c', name: 'C Project', areaSlug: 'y', housing: 'villa', stage: 'off-plan', n: 50, medianPriceAed: 3_000_000, medianPricePerSqmAed: 15_000 },
    ];

    expect(rankDubaiProjects(rows).map(({ rank, name }) => ({ rank, name }))).toEqual([
      { rank: 1, name: 'C Project' },
      { rank: 2, name: 'A Project' },
      { rank: 3, name: 'B Project' },
    ]);
  });

  it('ranks Tokyo condominium transactions by total price and excludes other types', () => {
    const rows = [
      { recordReference: '3', type: 'Land', municipality: 'Minato Ward', district: 'Akasaka', price: 9_000_000_000, areaSqm: 50, floorPlan: '', buildingYear: '', structure: '', period: '1st quarter 2026' },
      { recordReference: '2', type: 'Pre-owned Condominiums, etc.', municipality: 'Chiyoda Ward', district: 'Kioicho', price: 850_000_000, areaSqm: 140, floorPlan: '3LDK', buildingYear: '2022', structure: 'RC', period: '1st quarter 2026' },
      { recordReference: '1', type: 'Pre-owned Condominiums, etc.', municipality: 'Minato Ward', district: 'Mita', price: 1_200_000_000, areaSqm: 125, floorPlan: '3LDK', buildingYear: '2024', structure: 'RC', period: '1st quarter 2026' },
      { recordReference: '4', type: 'Pre-owned Condominiums, etc.', municipality: 'Shibuya Ward', district: 'Nampeidaicho', price: 850_000_000, areaSqm: 155, floorPlan: '2LDK', buildingYear: '2008', structure: 'RC', period: '1st quarter 2026' },
    ];

    expect(rankTokyoTransactions(rows).map(({ rank, recordReference }) => ({ rank, recordReference }))).toEqual([
      { rank: 1, recordReference: '1' },
      { rank: 2, recordReference: '2' },
      { rank: 3, recordReference: '4' },
    ]);
  });
});
