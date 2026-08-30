export type ExplorerDistrict = {
  readonly id: string;
  readonly label: string;
  readonly lat: number;
  readonly lng: number;
};

export type ExplorerNeighborhood = {
  readonly id: string;
  readonly districtCode: string;
  readonly nameKo: string;
  readonly nameEn: string;
  readonly lat: number;
  readonly lng: number;
};

export type ExplorerBuilding = {
  readonly id: string;
  readonly districtCode: string;
  readonly neighborhoodId: string;
  readonly nameKo: string;
  readonly nameEn: string;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly streetView: {
    readonly label: string;
    readonly disclaimer: string;
  };
  readonly evidence: {
    readonly depositWon: number | null;
    readonly monthlyRentWon: number | null;
    readonly adjustedPerSqmWon: number | null;
    readonly contractCount: number | null;
  };
};

/**
 * Stage 2A.1 preserves the verified legacy discovery shape only. These fixtures
 * are versioned UI parity data and must not be represented as current official
 * transaction evidence.
 */
export const EXPLORER_PARITY_FIXTURE_VERSION = 'legacy-parity-2026-08-30';

const districts: readonly ExplorerDistrict[] = [
  {
    id: '11590',
    label: 'Dongjak-gu (동작구)',
    lat: 37.5124,
    lng: 126.9393,
  },
];

const neighborhoods: readonly ExplorerNeighborhood[] = [
  { id: 'noryangjin-dong', districtCode: '11590', nameKo: '노량진동', nameEn: 'Noryangjin-dong', lat: 37.5123, lng: 126.942 },
  { id: 'sindaebang-dong', districtCode: '11590', nameKo: '신대방동', nameEn: 'Sindaebang-dong', lat: 37.4877, lng: 126.9133 },
  { id: 'sadang-dong', districtCode: '11590', nameKo: '사당동', nameEn: 'Sadang-dong', lat: 37.4838, lng: 126.9816 },
  { id: 'daebang-dong', districtCode: '11590', nameKo: '대방동', nameEn: 'Daebang-dong', lat: 37.5081, lng: 126.9263 },
  { id: 'sangdo-1-dong', districtCode: '11590', nameKo: '상도1동', nameEn: 'Sangdo 1-dong', lat: 37.5033, lng: 126.9527 },
  { id: 'sangdo-dong', districtCode: '11590', nameKo: '상도동', nameEn: 'Sangdo-dong', lat: 37.4993, lng: 126.9397 },
];

const streetView = {
  label: 'Street View near this building',
  disclaimer: 'Street View shows the nearby street, not a listing photo.',
} as const;

const noEvidence = {
  depositWon: null,
  monthlyRentWon: null,
  adjustedPerSqmWon: null,
  contractCount: null,
} as const;

const buildings: readonly ExplorerBuilding[] = [
  { id: 'noryangjin-dream-square', districtCode: '11590', neighborhoodId: 'noryangjin-dong', nameKo: '노량진 드림스퀘어 복합빌딩', nameEn: 'Noryangjin Dream Square Complex', lat: null, lng: null, streetView, evidence: noEvidence },
  { id: 'megastudy-tower', districtCode: '11590', neighborhoodId: 'noryangjin-dong', nameKo: '메가스터디타워', nameEn: 'Megastudy Tower', lat: null, lng: null, streetView, evidence: noEvidence },
  { id: 'hangang-cube-state', districtCode: '11590', neighborhoodId: 'noryangjin-dong', nameKo: '한강큐브스테이트', nameEn: 'Hangang Cube State', lat: null, lng: null, streetView, evidence: noEvidence },
  { id: 'noryangjin-cube-state', districtCode: '11590', neighborhoodId: 'noryangjin-dong', nameKo: '노량진큐브스테이트', nameEn: 'Noryangjin Cube State', lat: null, lng: null, streetView, evidence: noEvidence },
  { id: 'taeyoung-officetel', districtCode: '11590', neighborhoodId: 'noryangjin-dong', nameKo: '태영 오피스텔', nameEn: 'Taeyoung Officetel', lat: null, lng: null, streetView, evidence: noEvidence },
  { id: 'baekmyeong-trendy-tower', districtCode: '11590', neighborhoodId: 'noryangjin-dong', nameKo: '백명트렌디타워', nameEn: 'Baekmyeong Trendy Tower', lat: null, lng: null, streetView, evidence: noEvidence },
  { id: 'noryangjin-39-9', districtCode: '11590', neighborhoodId: 'noryangjin-dong', nameKo: '(39-9)', nameEn: 'Noryangjin (39-9)', lat: null, lng: null, streetView, evidence: noEvidence },
];

export function getExplorerDistrict(districtCode: string): ExplorerDistrict | null {
  return districts.find((district) => district.id === districtCode) ?? null;
}

export function getExplorerNeighborhoods(
  districtCode: string,
): readonly ExplorerNeighborhood[] {
  return neighborhoods.filter((item) => item.districtCode === districtCode);
}

export function getExplorerBuildings(
  districtCode: string,
  neighborhoodId: string,
): readonly ExplorerBuilding[] {
  return buildings.filter(
    (item) =>
      item.districtCode === districtCode &&
      item.neighborhoodId === neighborhoodId,
  );
}
