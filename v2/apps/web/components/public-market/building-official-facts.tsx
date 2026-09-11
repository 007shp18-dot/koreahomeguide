'use client';

import { useEffect, useState } from 'react';

import type { ReportedNearbyPlace } from '../../lib/public-market/reported-nearby-places';
import type { OfficialBuildingFacts } from '../../lib/public-market/official-building-facts.server';
import type { ObservedBuildingIdentityModel } from '../../lib/public-market/observed-building-route-model.server';
import type { ProductLocale } from '../../lib/locale/product-copy';
import { seoulDetailText } from '../../lib/locale/seoul-detail-copy';
import { BuildingProximityDisclosure } from './observed-building-detail';
import styles from './building-detail.module.css';

type Envelope = Readonly<{
  schemaVersion: 1;
  reportedNearby?: readonly ReportedNearbyPlace[];
  source: Readonly<{ apartment: string; register: string | null; nearby?: string | null }>;
  facts: OfficialBuildingFacts;
  proximity?: ObservedBuildingIdentityModel['proximity'] | null;
}>;

function area(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}㎡`;
}

function count(value: number): string {
  return value.toLocaleString('en-US');
}

export function ReadyOfficialFacts({ envelope, locale = 'en' }: Readonly<{ envelope: Envelope; locale?: ProductLocale }>) {
  if (envelope.facts.status !== 'ready') return null;
  const { apartment, register } = envelope.facts;
  const profile = [
    apartment.households === null ? null : ['Households', count(apartment.households)],
    apartment.buildings === null ? null : ['Buildings', count(apartment.buildings)],
    apartment.approvalDate === null && register?.approvalDate == null ? null : ['Approval date', apartment.approvalDate ?? register?.approvalDate ?? ''],
    apartment.heating === null ? null : ['Heating', apartment.heating],
    apartment.corridorType === null ? null : ['Corridor type', apartment.corridorType],
    apartment.saleType === null ? null : ['Sale type', apartment.saleType],
  ].filter((row): row is string[] => row !== null);
  const totalArea = register?.totalAreaSqm ?? apartment.totalAreaSqm;
  const structure = register?.structure ?? apartment.structure;
  const floorsAbove = register?.floorsAbove ?? apartment.floorsAbove;
  const floorsBelow = register?.floorsBelow ?? apartment.floorsBelow;
  const parkingSpaces = register?.parkingSpaces ?? apartment.parkingSpaces;
  const registerProfile = [
    register?.mainUse == null ? null : ['Main use', register.mainUse],
    structure == null ? null : ['Structure', structure],
    totalArea === null ? null : ['Total floor area', area(totalArea)],
    register?.buildingAreaSqm == null ? null : ['Building area', area(register.buildingAreaSqm)],
    floorsAbove == null && floorsBelow == null ? null : ['Floors', [
      floorsAbove == null ? null : `${count(floorsAbove)} ${locale === 'ko' ? '지상' : locale === 'zh-CN' ? '地上' : 'above'}`,
      floorsBelow == null ? null : `${count(floorsBelow)} ${locale === 'ko' ? '지하' : locale === 'zh-CN' ? '地下' : 'below'}`,
    ].filter(Boolean).join(' · ')],
    parkingSpaces == null ? null : ['Parking spaces', count(parkingSpaces)],
  ].filter((row): row is string[] => row !== null);
  const nearby = envelope.facts.nearby;
  const subway = nearby === null || nearby === undefined ? null : [
    nearby.subwayLine,
    nearby.subwayStation,
    nearby.subwayWalkTime,
  ].filter((value): value is string => value !== null).join(' · ');
  const nearbyProfile = nearby === null || nearby === undefined ? [] : [
    subway === null || subway === '' ? null : ['Subway', subway],
    nearby.busWalkTime === null ? null : ['Bus stop walk', nearby.busWalkTime],
    nearby.educationFacility === null ? null : ['Schools', nearby.educationFacility],
    nearby.convenientFacility === null ? null : ['Nearby services', nearby.convenientFacility],
  ].filter((row): row is string[] => row !== null);
  const sources = [
    ['Legal address', apartment.legalAddress],
    apartment.roadAddress === null ? null : ['Road address', apartment.roadAddress],
    ['Apartment source', envelope.source.apartment],
    register === null || envelope.source.register === null ? null : ['Register source', envelope.source.register],
    nearbyProfile.length === 0 || envelope.source.nearby == null ? null : ['Nearby source', envelope.source.nearby],
  ].filter((row): row is string[] => row !== null);
  const labels:Record<string,string>={Households:'세대 수',Buildings:'동 수','Approval date':'사용승인일',Heating:'난방', 'Corridor type':'복도 유형','Sale type':'공급 유형','Main use':'주용도',Structure:'구조','Total floor area':'연면적','Building area':'건축면적',Floors:'층수','Parking spaces':'주차대수',Subway:'지하철','Bus stop walk':'버스 정류장',Schools:'학교','Nearby services':'주변 편의시설','Legal address':'지번 주소','Road address':'도로명 주소','Apartment source':'단지 정보 출처','Register source':'건축물대장 출처','Nearby source':'주변 정보 출처'};
  const chineseLabels: Record<string, string> = { Households: '住户数', Buildings: '楼栋数', 'Approval date': '使用批准日期', Heating: '供暖', 'Corridor type': '走廊类型', 'Sale type': '供应类型', 'Main use': '主要用途', Structure: '结构', 'Total floor area': '总楼面面积', 'Building area': '建筑占地面积', Floors: '楼层', 'Parking spaces': '停车位', Subway: '地铁', 'Bus stop walk': '步行至公交站', Schools: '学校', 'Nearby services': '周边设施', 'Legal address': '地番地址', 'Road address': '道路地址', 'Apartment source': '楼盘资料来源', 'Register source': '建筑登记资料来源', 'Nearby source': '周边信息来源' };
  const grid = (rows: string[][], className: string | undefined) => rows.length === 0 ? null : <dl className={className}>{rows.map((row) => <div key={row[0]!}><dt>{locale === 'ko' ? labels[row[0]!] ?? row[0]! : locale === 'zh-CN' ? chineseLabels[row[0]!] ?? row[0]! : row[0]!}</dt><dd>{row[1]!}</dd></div>)}</dl>;
  return <>
    <div className={styles.sectionHeading}><h3>{locale === 'ko' ? '공식 건물 정보' : locale === 'zh-CN' ? '官方楼盘信息' : 'Official building information'}</h3></div>
    {grid(profile, styles.findingGrid)}
    {grid(registerProfile, styles.sourceGrid)}
    {nearbyProfile.length === 0 ? null : <>
      <div className={styles.sectionHeading}><h3>{locale === 'ko' ? '교통·학교·편의시설' : locale === 'zh-CN' ? '交通、学校与配套设施' : 'Transit, schools and local services'}</h3></div>
      {grid(nearbyProfile, `${styles.sourceGrid} ${styles.nearbyGrid}`)}
    </>}
    <details className={styles.sourceDetails}><summary>{locale === 'ko' ? '공식 주소와 정보 출처' : locale === 'zh-CN' ? '官方地址与信息来源' : 'Official addresses and fact sources'}</summary>{grid(sources, styles.sourceGrid)}</details>
  </>;
}

export function ReportedNearbyFacts({ places, facts, locale = 'en' }: Readonly<{
  places: readonly ReportedNearbyPlace[];
  facts: OfficialBuildingFacts;
  locale?: ProductLocale;
}>) {
  const nearby = facts.status === 'ready' ? facts.nearby : null;
  // The complete original K-apt field already names these facilities.
  const visible = places.filter((place) => place.kind === 'school'
    ? !nearby?.educationFacility?.trim() : !nearby?.subwayStation?.trim());
  if (visible.length === 0) return null;
  return <section className={styles.proximityDetails} data-building-reported-nearby="ready">
    <h3>{locale === 'ko' ? '단지에서 안내한 학교·역' : locale === 'zh-CN' ? '楼盘公布的学校与车站' : 'Schools and stations reported by the complex'}</h3>
    <dl className={`${styles.sourceGrid} ${styles.nearbyGrid}`}>{visible.map((place) => <div key={place.sourceId}>
      <dt>{place.kind === 'school' ? (locale === 'ko' ? '학교' : locale === 'zh-CN' ? '学校' : 'School') : (locale === 'ko' ? '지하철' : locale === 'zh-CN' ? '地铁站' : 'Station')}</dt>
      <dd>{[place.name, ...place.lines, place.walkingMinutesUpperBound === null ? null
        : locale === 'ko' ? `안내된 도보 시간: ${place.walkingMinutesUpperBound}분 이내`
          : locale === 'zh-CN' ? `公布步行时间：${place.walkingMinutesUpperBound}分钟以内` : `Reported walk: up to ${place.walkingMinutesUpperBound} min`].filter(Boolean).join(' · ')}</dd>
    </div>)}</dl>
    <p>{locale === 'ko' ? '단지 안내 자료이며 최단 거리나 학교 배정을 의미하지 않습니다.' : locale === 'zh-CN' ? '设施信息由楼盘公布，不代表最近距离或入学资格。' : 'Complex-reported facilities; this does not establish nearest distance or school eligibility.'}</p>
    <details className={styles.sourceDetails}><summary>{locale === 'ko' ? '주변 정보 출처' : locale === 'zh-CN' ? '周边信息来源' : 'Nearby source'}</summary>
      <a href="https://www.k-apt.go.kr/" target="_blank" rel="noreferrer">K-apt</a>
    </details>
  </section>;
}

export function reasonCopy(reason: Extract<OfficialBuildingFacts, { status: 'unavailable' }>['reason'], locale: ProductLocale = 'en') {
  if (locale === 'ko') {
    const reasons = { unsupported_housing_type: '이 주택 유형은 K-apt 제공 대상이 아닙니다.', configuration_missing: '공식 건물 정보가 아직 연결되지 않았습니다.', apartment_not_found: '주소가 정확히 일치하는 K-apt 단지를 찾지 못했습니다.', ambiguous_apartment_match: '동일한 후보가 여러 개여서 단지를 확정하지 못했습니다.', identity_mismatch: '공식 자료 간 건물 식별 정보가 일치하지 않습니다.' };
    return reasons[reason as keyof typeof reasons] ?? '공식 건물 정보를 일시적으로 불러올 수 없습니다.';
  }
  if (locale === 'zh-CN') {
    const reasons = { unsupported_housing_type: 'K-apt不提供此住宅类型的数据。', configuration_missing: '尚未接入官方楼盘数据。', apartment_not_found: '未找到地址完全匹配的K-apt楼盘。', ambiguous_apartment_match: '存在多个匹配楼盘，无法确认唯一对象。', identity_mismatch: '不同官方来源的楼盘标识不一致。' };
    return reasons[reason as keyof typeof reasons] ?? '官方楼盘信息暂时不可用。';
  }
  if (reason === 'unsupported_housing_type') return 'The K-apt apartment service does not cover this housing type.';
  if (reason === 'configuration_missing') return 'The official building-data connection is not configured.';
  if (reason === 'apartment_not_found') return 'No exact K-apt complex match was found.';
  if (reason === 'ambiguous_apartment_match') return 'More than one K-apt complex matched, so no facts were attached.';
  if (reason === 'identity_mismatch') return 'The official identity keys did not agree across sources.';
  return 'The official building services are temporarily unavailable.';
}

export function BuildingOfficialFacts({ districtSlug, buildingId, observedFacts = [], proximity, locale = 'en' }: Readonly<{
  districtSlug: string;
  buildingId: string;
  observedFacts?: readonly Readonly<{ label: string; value: string }>[];
  proximity?: ObservedBuildingIdentityModel['proximity'];
  locale?: ProductLocale;
}>) {
  const requestKey = `${districtSlug}/${buildingId}`;
  const [responseState, setResponseState] = useState<{ requestKey: string; value: Envelope | 'error' } | null>(null);
  const state = responseState?.requestKey === requestKey ? responseState.value : 'loading';

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ district: districtSlug, building: buildingId });
    void fetch(`/api/markets/kr-seoul/building-facts?${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new TypeError('Building facts unavailable.');
        return response.json() as Promise<Envelope>;
      })
      .then((value) => { if (!controller.signal.aborted) setResponseState({ requestKey, value }); })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !(error instanceof DOMException && error.name === 'AbortError')) setResponseState({ requestKey, value: 'error' });
      });
  return () => controller.abort();
  }, [buildingId, districtSlug, requestKey]);

  const dataState = state === 'loading' ? 'loading' : state === 'error' || state.facts.status === 'unavailable' ? 'unavailable' : 'ready';
    const visibleFacts = observedFacts.filter(fact => !/not reported|pending|unavailable|unverified/i.test(fact.value));
  const currentProximity = state !== 'loading' && state !== 'error' ? state.proximity ?? proximity : proximity;

  return (
    <section className={`${styles.evidence} ${styles.officialFacts}`} data-building-section="official-facts" data-building-facts={dataState}>
      <div className={styles.sectionHeading}><h2>{locale === 'ko' ? '건물·주변 정보' : locale === 'zh-CN' ? '房产与周边信息' : 'Property and location'}</h2></div>
      {visibleFacts.length === 0 ? null : <dl className={styles.findingGrid}>{visibleFacts.map((fact) => <div key={fact.label}><dt>{seoulDetailText(locale, fact.label)}</dt><dd>{seoulDetailText(locale, fact.value)}</dd></div>)}</dl>}
      <BuildingProximityDisclosure proximity={currentProximity} locale={locale} />
      {state !== 'loading' && state !== 'error' ? <ReportedNearbyFacts places={state.reportedNearby ?? []} facts={state.facts} locale={locale} /> : null}
      {state === 'loading' ? <p role="status">{locale === 'ko' ? '공식 건물·주변 정보를 불러오는 중입니다…' : locale === 'zh-CN' ? '正在加载官方楼盘与周边信息…' : 'Loading official building and nearby information…'}</p> : state === 'error' ? <p role="status">{locale === 'ko' ? '추가 건물 정보를 불러오지 못했습니다. 확인된 정보는 위에 표시됩니다.' : locale === 'zh-CN' ? '无法加载补充楼盘信息，已核实信息显示于上方。' : 'Additional building facts could not be loaded. Confirmed information is shown above.'}</p> : state.facts.status === 'unavailable' ? <p>{reasonCopy(state.facts.reason, locale)}</p> : null}
      {state !== 'loading' && state !== 'error' ? <ReadyOfficialFacts envelope={state} locale={locale} /> : null}
    </section>
  );
}
