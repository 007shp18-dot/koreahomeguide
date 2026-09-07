import 'server-only';

import { getSeoulDistrictBySlug } from '@signedprice/korea-rent/browser';
import type { SingaporeProjectSummary } from '@signedprice/singapore-property';
import { dubaiEvidenceRepositoryFromEnvironment } from '../dubai/evidence-repository.server';
import { koreaEvidenceRepositoriesFromEnvironment } from '../public-market/korea-evidence-repositories.server';
import { singaporeSnapshotRepositoryFromEnvironment } from '../singapore/snapshot-repository.server';
import type { PassportMarketEvidence, PassportScope } from './model';

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

function seoulEvidence(): PassportMarketEvidence {
  const repository = koreaEvidenceRepositoriesFromEnvironment().sale;
  if (repository === null) return Object.freeze({ id: 'kr-seoul', city: 'Seoul', currency: 'KRW', localBudget: 0, medianPsm: null, sample: 0, period: 'Unavailable', scopes: Object.freeze([]) });
  const artifact = repository.getArtifact();
  const buildings = repository.listBuildingRecords().filter(({ housingType }) => housingType === 'apartment');
  const unitPrices = buildings.flatMap(({ recentSales }) => recentSales.map(({ priceWon, areaSqm }) => priceWon / areaSqm)).filter(value => Number.isFinite(value) && value > 0);
  const scopes: PassportScope[] = buildings.flatMap((building) => {
    const all = building.cohorts.find(({ areaBand }) => areaBand === 'all')?.price;
    if (all?.published !== true) return [];
    const district = getSeoulDistrictBySlug(building.districtSlug);
    return district === null ? [] : [{ name: building.officialName, kind: 'building', sample: all.n,
      locationLabel: `${district.nameEn} · ${building.neighborhoodName}`,
      href: `/kr/seoul/explore/${building.districtSlug}/${building.buildingId}/?transaction=sale&propertyType=apartment`, medianPrice: all.med }];
  });
  return Object.freeze({ id: 'kr-seoul', city: 'Seoul', currency: 'KRW', localBudget: 0, medianPsm: median(unitPrices), sample: unitPrices.length, priceBasis: 'transactions', priceSample: unitPrices.length, period: artifact.period, scopes: Object.freeze(scopes) });
}

async function singaporeEvidence(): Promise<PassportMarketEvidence> {
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  if (repository === null) return Object.freeze({ id: 'sg-singapore', city: 'Singapore', currency: 'SGD', localBudget: 0, medianPsm: null, sample: 0, period: 'Unavailable', scopes: Object.freeze([]) });
  const projects = repository.listSegments().flatMap(({ segment }) => repository.listProjects(segment)).filter((project): project is Extract<SingaporeProjectSummary, { published: true }> => (
    project.published && project.propertyTypes.some((type) => type === 'apartment' || type === 'condominium')
  ));
  return Object.freeze({
    id: 'sg-singapore', city: 'Singapore', currency: 'SGD', localBudget: 0,
    medianPsm: median(projects.map(({ medianPsf }) => medianPsf * 10.7639104167)),
    sample: projects.reduce((sum, project) => sum + project.n, 0), priceBasis: 'projects', priceSample: projects.length, period: repository.getContext().period,
    scopes: Object.freeze(projects.map((project): PassportScope => ({ name: project.project, kind: 'project', sample: project.n, locationLabel: project.marketSegment, href: `/sg/singapore/explore/${project.marketSegment.toLowerCase()}/${project.id}/`, medianPrice: project.medianPriceSgd }))),
  });
}

function dubaiEvidence(): PassportMarketEvidence {
  const repository = dubaiEvidenceRepositoryFromEnvironment();
  if (repository === null) return Object.freeze({ id: 'ae-dubai', city: 'Dubai', currency: 'AED', localBudget: 0, medianPsm: null, sample: 0, period: 'Unavailable', scopes: Object.freeze([]) });
  const entries = repository.listAreas().flatMap((area) => {
    const segment = area.segments.find(({ housing }) => housing === 'apartment');
    return segment?.sales.ready == null ? [] : [{ area, segment, sale: segment.sales.ready }];
  });
  const context = repository.getContext();
  return Object.freeze({
    id: 'ae-dubai', city: 'Dubai', currency: 'AED', localBudget: 0,
    medianPsm: median(entries.map(({ sale }) => sale.medianPricePerSqmAed)),
    sample: entries.reduce((sum, { sale }) => sum + sale.n, 0),
    priceBasis: 'areas', priceSample: entries.length,
    period: `${context.comparisonPeriod.from}..${context.comparisonPeriod.to}`,
    yieldPct: median(entries.flatMap(({ segment }) => segment.readyGrossYieldPct === null ? [] : [segment.readyGrossYieldPct])),
    scopes: Object.freeze(entries.map(({ area, sale }): PassportScope => ({ name: area.name, kind: 'ready-area', sample: sale.n, href: `/ae/dubai/explore/${area.slug}/`, medianPrice: sale.medianPriceAed }))),
  });
}

export async function loadPassportEvidence(): Promise<readonly PassportMarketEvidence[]> {
  return Object.freeze([seoulEvidence(), await singaporeEvidence(), dubaiEvidence()]);
}
