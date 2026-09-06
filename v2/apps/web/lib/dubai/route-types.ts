import type {
  DubaiAreaEvidence,
  DubaiAreaSegmentEvidence,
  DubaiHousingSegment,
} from './evidence-contract';
import type { DubaiEvidenceContext } from './evidence-repository.server';

export type DubaiUnavailableModel = Readonly<{
  status: 'unavailable';
  message: 'Verified Dubai area evidence unavailable';
}>;
export type DubaiExploreArea = Readonly<{
  id: string;
  slug: string;
  name: string;
  searchAliases: readonly string[];
  href: `/ae/dubai/explore/${string}/` | null;
  segments: readonly DubaiAreaSegmentEvidence[];
}>;

export type DubaiExploreModel = DubaiUnavailableModel | Readonly<{
  status: 'ready';
  context: DubaiEvidenceContext;
  areas: readonly DubaiExploreArea[];
}>;

export type DubaiComparableArea = Readonly<{
  id: string;
  slug: string;
  name: string;
  href: `/ae/dubai/explore/${string}/`;
}>;

export type DubaiAreaSegmentModel = DubaiAreaSegmentEvidence & Readonly<{
  comparableAreas: Readonly<{
    ready: readonly DubaiComparableArea[];
    offPlan: readonly DubaiComparableArea[];
  }>;
}>;

export type DubaiAreaModel = Readonly<{
  status: 'ready';
  identity: Pick<DubaiAreaEvidence, 'id' | 'slug' | 'name' | 'searchAliases'>;
  segments: readonly DubaiAreaSegmentModel[];
  context: DubaiEvidenceContext;
  checkHref: `/ae/dubai/check/?${string}`;
}>;

export type DubaiCheckAreaOption = Readonly<{
  slug: string;
  name: string;
  housing: readonly DubaiHousingSegment[];
  evidence: DubaiAreaEvidence;
}>;

export type DubaiCheckModel = DubaiUnavailableModel | Readonly<{
  status: 'ready';
  context: DubaiEvidenceContext;
  areas: readonly DubaiCheckAreaOption[];
}>;
