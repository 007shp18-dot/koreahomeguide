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

function area(value: number | null): string {
  return value === null ? 'Not provided' : `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}㎡`;
}

function count(value: number | null): string {
  return value === null ? 'Not provided' : value.toLocaleString('en-US');
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
      {state !== 'loading' && state !== 'error' && state.facts.status === 'ready' ? <>
        <div className={styles.sectionHeading}><p>Official sources</p><h3>Complex and building-register profile</h3></div>
        <dl className={styles.findingGrid}>
          <div><dt>Households</dt><dd>{count(state.facts.apartment.households)}</dd></div>
          <div><dt>Buildings</dt><dd>{count(state.facts.apartment.buildings)}</dd></div>
          <div><dt>Approval date</dt><dd>{state.facts.apartment.approvalDate ?? state.facts.register?.approvalDate ?? 'Not provided'}</dd></div>
          <div><dt>Heating</dt><dd>{state.facts.apartment.heating ?? 'Not provided'}</dd></div>
          <div><dt>Corridor type</dt><dd>{state.facts.apartment.corridorType ?? 'Not provided'}</dd></div>
          <div><dt>Sale type</dt><dd>{state.facts.apartment.saleType ?? 'Not provided'}</dd></div>
        </dl>
        <dl className={styles.sourceGrid}>
          <div><dt>Main use</dt><dd>{state.facts.register?.mainUse ?? 'Not provided'}</dd></div>
          <div><dt>Structure</dt><dd>{state.facts.register?.structure ?? 'Not provided'}</dd></div>
          <div><dt>Total floor area</dt><dd>{area(state.facts.register?.totalAreaSqm ?? state.facts.apartment.totalAreaSqm)}</dd></div>
          <div><dt>Building area</dt><dd>{area(state.facts.register?.buildingAreaSqm ?? null)}</dd></div>
          <div><dt>Floors</dt><dd>{state.facts.register === null ? 'Not provided' : `${count(state.facts.register.floorsAbove)} above · ${count(state.facts.register.floorsBelow)} below`}</dd></div>
          <div><dt>Parking spaces</dt><dd>{count(state.facts.register?.parkingSpaces ?? null)}</dd></div>
        </dl>
        <dl className={styles.sourceGrid}>
          <div><dt>Legal address</dt><dd>{state.facts.apartment.legalAddress}</dd></div>
          <div><dt>Road address</dt><dd>{state.facts.apartment.roadAddress ?? 'Not provided'}</dd></div>
          <div><dt>Apartment source</dt><dd>{state.source.apartment}</dd></div>
          <div><dt>Register source</dt><dd>{state.facts.register === null ? 'No unique register row attached' : state.source.register}</dd></div>
        </dl>
      </> : null}
    </section>
  );
}
