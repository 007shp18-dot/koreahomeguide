import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { BuildingOfficialFacts, ReportedNearbyFacts } from '../components/public-market/building-official-facts';
import * as factsComponents from '../components/public-market/building-official-facts';

describe('building official facts panel', () => {
  test('starts with an honest loading boundary and an encoded installed identity request', () => {
    const html = renderToStaticMarkup(
      <BuildingOfficialFacts districtSlug="gangnam-gu" buildingId="gangnam-alpha" />,
    );
    expect(html).toContain('data-building-facts="loading"');
    expect(html).toContain('Nearby schools and stations');
    expect(html).toContain('Loading official building and nearby information');
    expect(html).not.toContain('Loading additional official building facts');
    expect(html).not.toMatch(/households|parking spaces|approval date/i);
  });

  test('shows weekly K-apt structure and official nearby facilities without inventing distance', () => {
    const ReadyFacts = (factsComponents as unknown as { ReadyOfficialFacts?: React.ComponentType<{ envelope: unknown }> }).ReadyOfficialFacts;
    expect(ReadyFacts).toBeTypeOf('function');
    if (ReadyFacts === undefined) return;
    const html = renderToStaticMarkup(<ReadyFacts envelope={{
      schemaVersion: 1,
      source: { apartment: 'K-apt weekly apartment profile (2026-09-04)', register: null, nearby: 'K-apt complex detail (2026-09-04)' },
      facts: {
        status: 'ready',
        source: { apartment: 'K-apt weekly apartment profile (2026-09-04)', register: null, nearby: 'K-apt complex detail (2026-09-04)' },
        match: { kaptCode: 'A10024564', bjdCode: '1168010300' },
        apartment: {
          name: '개포래미안포레스트', legalAddress: '서울특별시 강남구 개포동 1282', roadAddress: null,
          households: 2296, buildings: 31, heating: '지역난방', corridorType: '혼합식', saleType: '혼합',
          approvalDate: '2020-09-28', totalAreaSqm: 422390, structure: '철골철근콘크리트구조',
          floorsAbove: 35, floorsBelow: 3, parkingSpaces: 3961,
        },
        register: null,
        nearby: {
          subwayLine: '3호선', subwayStation: null, subwayWalkTime: null, busWalkTime: '5분이내',
          educationFacility: '초등학교(구룡초, 포이초)', convenientFacility: '공원(달터공원)',
        },
      },
    }} />);

    expect(html).toContain('철골철근콘크리트구조');
    expect(html).toContain('3,961');
    expect(html).toContain('3호선');
    expect(html).toContain('초등학교(구룡초, 포이초)');
    expect(html).not.toMatch(/meters|metres|\d+m\b/i);
    expect(html).not.toContain('MOLIT Building HUB');
    expect(html).toContain('Official building information');
    expect(html).not.toContain('Complex and building-register profile');
  });
});


test('shows reported schools and bounded walking time independently of apartment facts', () => {
  const html = renderToStaticMarkup(<ReportedNearbyFacts facts={{ status: 'unavailable', reason: 'apartment_not_found' }} places={[
    { kind: 'station', sourceId: 'kapt:A1:station:1', name: '녹천', lines: ['1호선'], walkingMinutesUpperBound: 5, source: 'https://www.k-apt.go.kr/' },
    { kind: 'school', sourceId: 'kapt:A1:school:1', name: '창일초', lines: [], walkingMinutesUpperBound: null, source: 'https://www.k-apt.go.kr/' },
  ]} />);
  expect(html).toContain('창일초');
  expect(html).toContain('녹천');
  expect(html).toContain('Reported walk: up to 5 min');
  expect(html).toContain('does not establish nearest distance or school eligibility');
  expect(html).not.toContain('0 m');
});
