import {
  buildSingaporeSnapshot,
  stringifySingaporeSnapshot,
  type SingaporeMarketSegment,
  type UraPrivateSaleTransaction,
} from '@signedprice/singapore-property';

const projectBySegment = {
  CCR: { project: 'Civic Test Residences', street: 'Civic Test Road', district: '09', x: 28000, y: 31000 },
  RCR: { project: 'Central Test Court', street: 'Central Test Street', district: '12', x: 30000, y: 34000 },
  OCR: { project: 'Outer Test Gardens', street: 'Outer Test Avenue', district: '18', x: 36000, y: 41000 },
} as const;

const records: UraPrivateSaleTransaction[] = [];
for (const [segmentIndex, segment] of (['CCR', 'RCR', 'OCR'] as const).entries()) {
  const identity = projectBySegment[segment];
  for (let index = 0; index < 6; index += 1) {
    const batch = (index % 4) + 1;
    records.push(Object.freeze({
      ...identity,
      marketSegment: segment as SingaporeMarketSegment,
      areaSqm: 80 + segmentIndex * 15 + index,
      floorRange: `${String(index + 1).padStart(2, '0')}-${String(index + 5).padStart(2, '0')}`,
      units: 1,
      contractDate: `${String(8 - (index % 3)).padStart(2, '0')}26`,
      contractMonth: `2026-${String(8 - (index % 3)).padStart(2, '0')}-01`,
      saleType: (['new_sale', 'sub_sale', 'resale'] as const)[index % 3]!,
      priceSgd: 1_500_000 + segmentIndex * 300_000 + index * 25_000,
      propertyType: index % 2 === 0 ? 'condominium' : 'apartment',
      areaBasis: 'strata',
      tenure: index % 2 === 0 ? 'Freehold' : '99 yrs lease commencing from 2020',
      sourceOrder: Object.freeze({ batch, project: segmentIndex, transaction: index }),
    }));
  }
}

const snapshot = buildSingaporeSnapshot({
  records,
  generatedAt: '2026-08-31T09:00:00.000Z',
  rights: { operations: { aggregate: 'allowed', display: 'allowed' } },
});

export const SINGAPORE_SNAPSHOT_TEST_ARTIFACT = stringifySingaporeSnapshot(snapshot);
export const SINGAPORE_SNAPSHOT_TEST_SHA256 = snapshot.digest;
export const SINGAPORE_SNAPSHOT_TEST_PERIOD = '2026-06..2026-08';
export const SINGAPORE_TEST_PROJECT_ID = snapshot.projects.find(
  ({ marketSegment }) => marketSegment === 'CCR',
)!.id;
