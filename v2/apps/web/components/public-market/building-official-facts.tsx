'use client';

import { useEffect, useState } from 'react';

import type { OfficialBuildingFacts } from '../../lib/public-market/official-building-facts.server';
import type { ObservedBuildingIdentityModel } from '../../lib/public-market/observed-building-route-model.server';
import type { ProductLocale } from '../../lib/locale/product-copy';
import { BuildingProximityDisclosure } from './observed-building-detail';
import styles from './building-detail.module.css';

type Envelope = Readonly<{
  schemaVersion: 1;
  source: Readonly<{ apartment: string; register: string }>;
  facts: OfficialBuildingFacts;
}>;

function area(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}㎡`;
}

function count(value: number): string {
  return value.toLocaleString('en-US');
}

function ReadyOfficialFacts({ envelope }: Readonly<{ envelope: Envelope }>) {
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
  const registerProfile = [
    register?.mainUse == null ? null : ['Main use', register.mainUse],
    register?.structure == null ? null : ['Structure', register.structure],
    totalArea === null ? null : ['Total floor area', area(totalArea)],
    register?.buildingAreaSqm == null ? null : ['Building area', area(register.buildingAreaSqm)],
    register?.floorsAbove == null && register?.floorsBelow == null ? null : ['Floors', [
      register?.floorsAbove == null ? null : `${count(register.floorsAbove)} above`,
      register?.floorsBelow == null ? null : `${count(register.floorsBelow)} below`,
    ].filter(Boolean).join(' · ')],
    register?.parkingSpaces == null ? null : ['Parking spaces', count(register.parkingSpaces)],
  ].filter((row): row is string[] => row !== null);
  const sources = [
    ['Legal address', apartment.legalAddress],
    apartment.roadAddress === null ? null : ['Road address', apartment.roadAddress],
    ['Apartment source', envelope.source.apartment],
    register === null ? null : ['Register source', envelope.source.register],
  ].filter((row): row is string[] => row !== null);
  const grid = (rows: string[][], className: string | undefined) => rows.length === 0 ? null : <dl className={className}>{rows.map((row) => <div key={row[0]!}><dt>{row[0]!}</dt><dd>{row[1]!}</dd></div>)}</dl>;
  return <>
    <div className={styles.sectionHeading}><p>Official sources</p><h3>Complex and building-register profile</h3></div>
    {grid(profile, styles.findingGrid)}
    {grid(registerProfile, styles.sourceGrid)}
    {grid(sources, styles.sourceGrid)}
  </>;
}

function reasonCopy(reason: Extract<OfficialBuildingFacts, { status: 'unavailable' }>['reason']) {
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
  return (
    <section className={styles.evidence} data-building-section="official-facts" data-building-facts={dataState}>
      <div className={styles.sectionHeading}><p>Building facts</p><h2>Verified property profile</h2></div>
      {observedFacts.length === 0 ? null : <dl className={styles.findingGrid}>{observedFacts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
      <BuildingProximityDisclosure proximity={proximity} locale={locale} />
      {state === 'loading' ? <p role="status">Loading additional official building facts…</p> : null}
      {state === 'error' ? <p>공식 건축물대장 연결을 다시 확인 중입니다. 위의 확인된 거래·지도·역·학교 정보는 그대로 유지됩니다.</p> : null}
      {state !== 'loading' && state !== 'error' && state.facts.status === 'unavailable' ? <>
        <p>{reasonCopy(state.facts.reason)}</p>
        <p>공식 정보가 아직 연결되지 않은 항목만 비워 두며, 위의 확인된 정보는 계속 표시합니다.</p>
      </> : null}
      {state !== 'loading' && state !== 'error' ? <ReadyOfficialFacts envelope={state} /> : null}
    </section>
  );
}
