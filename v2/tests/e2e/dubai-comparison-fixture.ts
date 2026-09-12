import { createHash } from 'node:crypto';
import { dubaiComparableEvidenceFixture, withDubaiEvidenceDataDigest } from '../../apps/web/test/dubai-evidence-fixture';

// Synthetic evidence used only by the dedicated comparison browser run.
const base = dubaiComparableEvidenceFixture();
const template = base.areas[1]!;
const areas = [...base.areas, ...[
  { slug: 'burj-khalifa', name: 'Burj Khalifa' },
  { slug: 'palm-jumeirah', name: 'Palm Jumeirah' },
].map(({ slug, name }) => ({ ...template, id: `ae-dubai:area:${slug}`, slug, name, searchAliases: [name] }))];
const snapshot = withDubaiEvidenceDataDigest({
  ...base,
  sources: { ...base.sources, transactions: { ...base.sources.transactions, rows: 248 }, rents: { ...base.sources.rents, rows: 240 } },
  totals: { ...base.totals, qualifyingSaleRows: 248, mappedSaleRows: 248, qualifyingRentRows: 240, publishedAreas: 4, publishedSegments: 4 },
  areas,
});
export const DUBAI_COMPARISON_TEST_ARTIFACT = JSON.stringify(snapshot);
export const DUBAI_COMPARISON_TEST_SHA256 = createHash('sha256').update(DUBAI_COMPARISON_TEST_ARTIFACT).digest('hex');
