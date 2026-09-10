'use client';

import { useEffect, useState } from 'react';

import type { OfficialBuildingFacts } from '../../lib/public-market/official-building-facts.server';
import type { ObservedBuildingIdentityModel } from '../../lib/public-market/observed-building-route-model.server';
import type { ProductLocale } from '../../lib/locale/product-copy';
import { seoulDetailText } from '../../lib/locale/seoul-detail-copy';
import { BuildingProximityDisclosure } from './observed-building-detail';
import styles from './building-detail.module.css';

type Envelope = Readonly<{
  schemaVersion: 1;
  source: Readonly<{ apartment: string; register: string | null; nearby?: string | null }>;
  facts: OfficialBuildingFacts;
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
      floorsAbove == null ? null : `${count(floorsAbove)} above`,
      floorsBelow == null ? null : `${count(floorsBelow)} below`,
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
  const grid = (rows: string[][], className: string | undefined) => rows.length === 0 ? null : <dl className={className}>{rows.map((row) => <div key={row[0]!}><dt>{locale === 'ko' ? labels[row[0]!] ?? row[0]! : row[0]!}</dt><dd>{row[1]!}</dd></div>)}</dl>;
  return <>
    <div className={styles.sectionHeading}><h3>{locale === 'ko' ? '공식 건물 정보' : 'Official building information'}</h3></div>
    {grid(profile, styles.findingGrid)}
    {grid(registerProfile, styles.sourceGrid)}
    {nearbyProfile.length === 0 ? null : <>
      <div className={styles.sectionHeading}><h3>{locale === 'ko' ? '교통·학교·편의시설' : 'Transit, schools and local services'}</h3></div>
      {grid(nearbyProfile, `${styles.sourceGrid} ${styles.nearbyGrid}`)}
    </>}
    <details className={styles.sourceDetails}><summary>{locale === 'ko' ? '공식 주소와 정보 출처' : 'Official addresses and fact sources'}</summary>{grid(sources, styles.sourceGrid)}</details>
  </>;
}

export function reasonCopy(reason: Extract<OfficialBuildingFacts, { status: 'unavailable' }>['reason'], locale: ProductLocale = 'en') {
  if (locale === 'ko') {
    const reasons = { unsupported_housing_type: '이 주택 유형은 K-apt 제공 대상이 아닙니다.', configuration_missing: '공식 건물 정보가 아직 연결되지 않았습니다.', apartment_not_found: '주소가 정확히 일치하는 K-apt 단지를 찾지 못했습니다.', ambiguous_apartment_match: '동일한 후보가 여러 개여서 단지를 확정하지 못했습니다.', identity_mismatch: '공식 자료 간 건물 식별 정보가 일치하지 않습니다.' };
    return reasons[reason as keyof typeof reasons] ?? '공식 건물 정보를 일시적으로 불러올 수 없습니다.';
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
  const [state, setState] = useState<Envelope | 'loading' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ district: districtSlug, building: buildingId });
    void fetch(`/api/markets/kr-seoul/building-facts?${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new TypeError('Building facts unavailable.');
        return response.json() as Promise<Envelope>;
      })
      .then(setState)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setState('error');
      });
  return () => controller.abort();
  }, [buildingId, districtSlug]);

  const dataState = state === 'loading' ? 'loading' : state === 'error' || state.facts.status === 'unavailable' ? 'unavailable' : 'ready';
    const visibleFacts = observedFacts.filter(fact => !/not reported|pending|unavailable|unverified/i.test(fact.value));
  if (visibleFacts.length === 0 && dataState !== 'ready' && proximity?.coordinateStatus !== 'ready') return null;

  return (
    <section className={`${styles.evidence} ${styles.officialFacts}`} data-building-section="official-facts" data-building-facts={dataState}>
      <div className={styles.sectionHeading}><h2>{locale === 'ko' ? '건물·주변 정보' : 'Property and location'}</h2></div>
      {visibleFacts.length === 0 ? null : <dl className={styles.findingGrid}>{visibleFacts.map((fact) => <div key={fact.label}><dt>{seoulDetailText(locale, fact.label)}</dt><dd>{seoulDetailText(locale, fact.value)}</dd></div>)}</dl>}
      <BuildingProximityDisclosure proximity={proximity} locale={locale} />
      {state !== 'loading' && state !== 'error' ? <ReadyOfficialFacts envelope={state} locale={locale} /> : null}
    </section>
  );
}
