import { describe, expect, it } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any -- contract test keeps fixture shapes implementation-neutral */

type ExplorerDataModule = {
  getExplorerDistrict: (districtCode: string) => any;
  getExplorerNeighborhoods: (districtCode: string) => readonly any[];
  getExplorerBuildings: (
    districtCode: string,
    neighborhoodId: string,
  ) => readonly any[];
};

async function loadExplorerData(): Promise<ExplorerDataModule> {
  const modulePath = '../lib/seoul-explorer-data';
  return import(/* @vite-ignore */ modulePath) as Promise<ExplorerDataModule>;
}

describe('approved Dongjak discovery slice', () => {
  it('presents the district as Dongjak-gu without exposing its raw legal code as copy', async () => {
    const { getExplorerDistrict } = await loadExplorerData();
    const district = getExplorerDistrict('11590');

    expect(district).toMatchObject({
      id: '11590',
      label: 'Dongjak-gu (동작구)',
    });
    expect(district.label).not.toContain('11590');
  });

  it('publishes exactly the six evidence-backed Dongjak neighborhoods in source order', async () => {
    const { getExplorerNeighborhoods } = await loadExplorerData();
    const neighborhoods = getExplorerNeighborhoods('11590');

    expect(neighborhoods.map((item) => item.nameKo)).toEqual([
      '노량진동',
      '신대방동',
      '사당동',
      '대방동',
      '상도1동',
      '상도동',
    ]);
    expect(neighborhoods.every((item) => Number.isFinite(item.lat))).toBe(true);
    expect(neighborhoods.every((item) => Number.isFinite(item.lng))).toBe(true);
  });

  it('publishes the seven operating Noryangjin names without inventing coordinates', async () => {
    const { getExplorerNeighborhoods, getExplorerBuildings } =
      await loadExplorerData();
    const noryangjin = getExplorerNeighborhoods('11590').find(
      (item) => item.nameKo === '노량진동',
    );
    const buildings = getExplorerBuildings('11590', noryangjin.id);

    expect(buildings).toHaveLength(7);
    expect(buildings.map((item) => item.nameKo)).toEqual([
      '노량진 드림스퀘어 복합빌딩',
      '메가스터디타워',
      '한강큐브스테이트',
      '노량진큐브스테이트',
      '태영 오피스텔',
      '백명트렌디타워',
      '(39-9)',
    ]);
    expect(buildings.every((item) => item.lat === null)).toBe(true);
    expect(buildings.every((item) => item.lng === null)).toBe(true);
    expect(JSON.stringify(buildings)).not.toMatch(/검증 건물|verified building/i);
  });
});
