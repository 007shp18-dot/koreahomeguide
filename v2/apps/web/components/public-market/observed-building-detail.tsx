import Link from 'next/link';
import type { ReactNode } from 'react';

import type { ObservedBuildingIdentityModel } from '../../lib/public-market/observed-building-route-model.server';
import type { KoreaExplorerBuildingDetailModel } from '../../lib/public-market/korea-explorer-evidence.server';
import { localizedSeoulHref, type ProductLocale } from '../../lib/locale/product-copy';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
} from '../../lib/site-copy';
import { SiteFooter } from '../site-footer';
import { BuildingDetailHeader } from './building-detail-header';
import styles from './building-detail.module.css';

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul building identity, with price publication limits shown.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

const exactEvidenceFooter: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Exact-cohort Seoul contract evidence, with publication limits shown.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

const countLabel = (count: number) => `${count} observed contract${count === 1 ? '' : 's'}`;

function BuildingLocalContext({ buildingId, district }: Readonly<{ buildingId: string; district: string }>) {
  return <section className={styles.localContext} aria-label="Building news and community">
    <article><span>NEWS</span><h2>Local market context</h2><p>Verified briefs related to this district appear with their source and evidence state.</p><Link href={`/kr/seoul/news/?district=${district}`}>View local news →</Link></article>
    <article><span>COMMUNITY · READ-ONLY</span><h2>Building community</h2><p>This exact building identity is ready to anchor discussions once moderation controls open.</p><Link href={`/kr/seoul/community/?district=${district}&building=${buildingId}`}>Open community scope →</Link></article>
  </section>;
}

function KnownBuildingFacts({ facts }: Readonly<{ facts: readonly Readonly<{ label: string; value: string }>[] }>) {
  return <section className={styles.knownFacts} aria-labelledby="known-building-facts-heading" data-building-facts="known">
    <div className={styles.sectionHeading}><p>Building profile</p><h2 id="known-building-facts-heading">Verified facts already attached</h2></div>
    <dl className={styles.findingGrid}>{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
  </section>;
}

const proximityCopy = Object.freeze({
  en: Object.freeze({
    heading: 'Proximity',
    unavailable: 'Proximity data unavailable',
    pending: 'Distance not confirmed',
    coordinateUnavailable: 'Coordinate unavailable',
    station: 'Nearest station · straight-line distance',
    school: 'School proximity · straight-line distance',
    unavailableFact: 'Unavailable',
    stationSource: 'Station source',
    schoolSource: 'School source',
    coordinateSource: 'Coordinate source',
    methodology: 'Methodology',
    version: 'Version',
    asOf: 'As of',
    attendanceDisclaimer: 'School proximity is not an attendance-zone assignment.',
    methodologySuffix: '',
  }),
  ko: Object.freeze({
    heading: '인접성',
    unavailable: '인접성 데이터를 확인할 수 없습니다.',
    pending: '거리 미확정',
    coordinateUnavailable: '좌표 확인 불가',
    station: '가까운 역 · 직선거리',
    school: '학교 인접성 · 직선거리',
    unavailableFact: '확인 불가',
    stationSource: '역 출처',
    schoolSource: '학교 출처',
    coordinateSource: '좌표 출처',
    methodology: '산정 방법',
    version: '버전',
    asOf: '기준',
    attendanceDisclaimer: '학교 인접성은 배정 학군이 아닙니다.',
    methodologySuffix: ' · 직선거리',
  }),
} satisfies Readonly<Record<ProductLocale, Readonly<Record<string, string>>>>);

export function BuildingProximityDisclosure({ proximity, locale = 'en' }: Readonly<{
  proximity: ObservedBuildingIdentityModel['proximity'] | undefined;
  locale?: ProductLocale;
}>) {
  const copy = proximityCopy[locale];
  if (proximity === undefined || proximity.status !== 'ready') return <p data-proximity-state={proximity?.status ?? 'missing'}>{copy.unavailable}</p>;
  return <section data-building-proximity="ready">
    <h3>{copy.heading}</h3>
    {proximity.coordinateStatus === 'pending_coordinate' ? <p>{copy.pending}</p> : proximity.coordinateStatus === 'unavailable' ? <p>{copy.coordinateUnavailable}</p> : <dl className={styles.findingGrid}>
      <div><dt>{copy.station}</dt><dd>{proximity.nearestStation === null ? copy.unavailableFact : `${proximity.nearestStation.name} · ${proximity.nearestStation.lines.join(', ')} · ${Math.round(proximity.nearestStation.distanceMeters)} m`}</dd></div>
      <div><dt>{copy.school}</dt><dd>{proximity.nearestSchool === null ? copy.unavailableFact : `${proximity.nearestSchool.name} · ${Math.round(proximity.nearestSchool.distanceMeters)} m`}</dd></div>
    </dl>}
    <p>{copy.attendanceDisclaimer}</p>
    {proximity.provenance === undefined ? null : <dl className={styles.sourceGrid}>
      <div><dt>{copy.stationSource}</dt><dd>{proximity.provenance.stationSource.landingPage} · {copy.version} {proximity.provenance.stationSource.sourceVersion} · {copy.asOf} {proximity.provenance.stationSource.asOf}</dd></div>
      <div><dt>{copy.schoolSource}</dt><dd>{proximity.provenance.schoolSource.landingPage} · {copy.version} {proximity.provenance.schoolSource.sourceVersion} · {copy.asOf} {proximity.provenance.schoolSource.asOf}</dd></div>
      <div><dt>{copy.coordinateSource}</dt><dd>{proximity.provenance.coordinateSource.landingPage} · {copy.version} {proximity.provenance.coordinateSource.sourceVersion} · {copy.asOf} {proximity.provenance.coordinateSource.asOf}</dd></div>
      <div><dt>{copy.methodology}</dt><dd>{proximity.provenance.methodology}{copy.methodologySuffix}</dd></div>
    </dl>}
  </section>;
}

export function ObservedBuildingDetail({
  model,
  backHref,
  visual,
  facts,
  locale = 'en',
}: Readonly<{
  model: ObservedBuildingIdentityModel;
  backHref: string;
  visual?: ReactNode;
  facts?: ReactNode;
  locale?: ProductLocale;
}>) {
  const hasMonthly = model.observations.monthly > 0;
  const hasJeonse = model.observations.jeonse > 0;
  const evidenceKinds = [
    hasJeonse ? 'Jeonse' : null,
    hasMonthly ? 'Monthly rent' : null,
  ].filter((value): value is string => value !== null).join(' + ');
  const coordinateLabel = model.coordinate.status === 'ready'
    ? 'Verified coordinate available'
    : 'Coordinate verification pending';

  return (
    <div id="top" className={styles.page}>
      <BuildingDetailHeader />
      <main className={styles.main} data-building-detail="identity-only">
        <section
          className={styles.identityHero}
          data-identity-hero="true"
          data-building-section="identity"
        >
          {visual ?? <div className={styles.visualUnavailable} data-building-media="identity-evidence">
            <div className={styles.visualEvidenceMark} aria-hidden="true">
              <span>Observed</span>
              <span>Identity</span>
              <span>Verified</span>
            </div>
            <div className={styles.visualUnavailableCopy}>
              <small>Publication boundary</small>
              <strong>No published building price yet</strong>
              <p>{model.source.boundary}</p>
            </div>
          </div>}
          <div className={styles.identitySummary}>
            <Link className={styles.backAction} href={backHref}>
              Back to {model.district.nameEn} Explore
            </Link>
            <p className={styles.identityEyebrow}>Verified observed building identity</p>
            <h1>{model.building.officialName}</h1>
            <p>{model.building.neighborhoodName} · {model.district.nameEn}</p>
            <dl className={styles.factGrid}>
              <div><dt>Housing type</dt><dd>{model.building.housingType}</dd></div>
              <div><dt>Observed contracts</dt><dd>{countLabel(model.observations.total)}</dd></div>
              <div><dt>Contract evidence</dt><dd>{evidenceKinds}</dd></div>
              <div><dt>Observed period</dt><dd>{model.observations.firstMonth}–{model.observations.lastMonth}</dd></div>
            </dl>
          </div>
        </section>

        <KnownBuildingFacts facts={[
          { label: 'Official identity', value: model.building.officialName },
          { label: 'Area', value: `${model.building.neighborhoodName} · ${model.district.nameEn}` },
          { label: 'Housing type', value: model.building.housingType },
          { label: 'Observed evidence', value: countLabel(model.observations.total) },
          { label: 'Evidence period', value: `${model.observations.firstMonth}–${model.observations.lastMonth}` },
          { label: 'Map identity', value: coordinateLabel },
        ]} />
        {facts}

        <BuildingLocalContext buildingId={model.building.buildingId} district={model.district.slug} />

        <section className={styles.evidence} data-building-section="identity-evidence">
          <div className={styles.sectionHeading}>
            <p>Evidence boundary</p>
            <h2>Price evidence unavailable</h2>
          </div>
          <p>{model.evidence.message}</p>
          <dl className={styles.findingGrid}>
            <div><dt>All observed</dt><dd>{model.observations.total}</dd></div>
            <div><dt>Jeonse</dt><dd>{model.observations.jeonse}</dd></div>
            <div><dt>Monthly rent</dt><dd>{model.observations.monthly}</dd></div>
            <div><dt>Map status</dt><dd>{coordinateLabel}</dd></div>
          </dl>
          <BuildingProximityDisclosure proximity={model.proximity} locale={locale} />
          <details className={styles.sourceDetails}>
            <summary>Source and observation details</summary>
            <dl className={styles.sourceGrid}>
              <div><dt>Source</dt><dd>{model.source.provider} {model.source.dataset}</dd></div>
              <div><dt>Source period</dt><dd>{model.source.period}</dd></div>
              <div><dt>Observed first</dt><dd>{model.observations.firstMonth}</dd></div>
              <div><dt>Observed latest</dt><dd>{model.observations.lastMonth}</dd></div>
            </dl>
          </details>
          <div className={styles.actions}>
            <Link href={backHref}>Return to Explore</Link>
            <Link href="/trust/">Read the evidence policy</Link>
          </div>
        </section>
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}

const areaLabels = Object.freeze({
  all: 'All home sizes',
  'under-40': 'Under 40㎡',
  '40-60': '40–60㎡',
  '60-85': '60–85㎡',
  '85-plus': '85㎡ and above',
} as const);

const transactionLabels = Object.freeze({
  jeonse: 'Jeonse',
  monthly: 'Monthly rent',
  sale: 'Sale',
} as const);

const primaryMetricLabels = Object.freeze({
  deposit: 'Deposit median',
  'monthly-rent': 'Monthly rent median',
  'sale-price': 'Sale price median',
} as const);

export function KoreaEvidenceBuildingDetail({
  model,
  backHref,
  visual,
  facts,
  locale = 'en',
}: Readonly<{
  model: KoreaExplorerBuildingDetailModel;
  backHref: string;
  visual?: ReactNode;
  facts?: ReactNode;
  locale?: ProductLocale;
}>) {
  const areaLabel = areaLabels[model.selection.areaBand];
  const transactionLabel = transactionLabels[model.selection.transaction];
  const primaryLabel = primaryMetricLabels[model.evidence.primaryMetric];
  const publicationHeading = model.evidence.state === 'published'
    ? 'Published exact-cohort evidence'
    : model.evidence.state === 'withheld'
      ? 'Exact cohort below publication minimum'
      : 'No selected-cohort contracts observed';

  return (
    <div id="top" className={styles.page}>
      <BuildingDetailHeader />
      <main className={styles.main} data-building-detail="exact-evidence" data-detail-locale={locale}>
        <section
          className={styles.identityHero}
          data-identity-hero="true"
          data-building-section="identity"
        >
          {visual ?? <div className={styles.visualUnavailable} data-building-media="exact-cohort-evidence">
            <div className={styles.visualEvidenceMark} aria-hidden="true">
              <span>Official</span>
              <span>Exact cohort</span>
              <span>Verified</span>
            </div>
            <div className={styles.visualUnavailableCopy}>
              <small>Publication boundary</small>
              <strong>{publicationHeading}</strong>
              <p>
                Values publish only when at least five eligible MOLIT-reported contracts
                remain in the selected transaction, area, and building cohort.
              </p>
            </div>
          </div>}
          <div className={styles.identitySummary}>
            <Link className={styles.backAction} href={backHref}>
              Back to {model.district.nameEn} Explore
            </Link>
            <p className={styles.identityEyebrow}>Verified building contract evidence</p>
            <h1>{model.building.officialName}</h1>
            <p>{model.building.neighborhoodName} · {model.district.nameEn}</p>
            <dl className={styles.factGrid}>
              <div><dt>Transaction</dt><dd>{transactionLabel}</dd></div>
              <div><dt>Area cohort</dt><dd>{areaLabel}</dd></div>
              <div><dt>Housing type</dt><dd>{model.building.housingType}</dd></div>
              <div><dt>Evidence period</dt><dd>{model.period}</dd></div>
            </dl>
          </div>
        </section>

        <section className={styles.evidence} data-building-section="exact-evidence">
          <div className={styles.sectionHeading}>
            <p>{transactionLabel} · {areaLabel}</p>
            <h2>{publicationHeading}</h2>
          </div>
          <dl className={styles.findingGrid}>
            <div><dt>{primaryLabel}</dt><dd>{model.evidence.medianLabel ?? 'Not published'}</dd></div>
            <div><dt>{locale === 'ko' ? '신고 거래 수' : 'Reported filings'}</dt><dd>{model.evidence.sampleLabel}</dd></div>
            <div><dt>{locale === 'ko' ? '㎡당 가격' : 'Price per ㎡'}</dt><dd>{locale === 'ko' ? '미확인' : 'Not verified'}</dd></div>
            <div><dt>{locale === 'ko' ? '최근 변동' : 'Recent change'}</dt><dd>{locale === 'ko' ? '비교 표본 미확인' : 'Comparison sample unverified'}</dd></div>
            <div><dt>Middle half</dt><dd>{model.evidence.middleHalfLabel ?? 'Not published'}</dd></div>
            <div><dt>Observed range</dt><dd>{model.evidence.rangeLabel ?? 'Not published'}</dd></div>
          </dl>
          {model.evidence.primaryMetric === 'monthly-rent' ? (
            <dl className={styles.sourceGrid}>
              <div>
                <dt>Filed deposit median</dt>
                <dd>{model.evidence.filedDepositMedianLabel ?? 'Not published'}</dd>
              </div>
              <div><dt>Monthly rent metric</dt><dd>Filed monthly rent only</dd></div>
              <div><dt>Area scope</dt><dd>{areaLabel}</dd></div>
              <div><dt>Contract group</dt><dd>{model.selection.contractGroup}</dd></div>
            </dl>
          ) : null}

          <section className={styles.trendUnavailable} aria-labelledby="building-price-trend-heading">
            <span>{locale === 'ko' ? '가격 시계열' : 'Price trend'}</span>
            <h3 id="building-price-trend-heading">{locale === 'ko' ? '월별 비교 표본을 확인하는 중입니다.' : 'Monthly comparison cohorts are not yet verified.'}</h3>
            <p>{locale === 'ko' ? '현재 릴리스는 선택 기간의 분포와 실제 신고 행만 보유합니다. 월별 가격선을 임의로 만들지 않습니다.' : 'This release retains the selected-period distribution and actual filing rows. It does not fabricate a monthly line from incomplete cohorts.'}</p>
          </section>

          <div className={styles.sectionHeading}><p>{locale === 'ko' ? '실제 신고 거래' : 'Reported filings'}</p><h2>{locale === 'ko' ? '선택 조건에 남은 신고 행' : 'Filings retained in this exact cohort'}</h2></div>
          {model.recentTransactions.length === 0 ? (
            <p>No privacy-safe recent rows remain in this selected cohort.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Filed month</th>
                    <th>Area</th>
                    <th>{primaryLabel}</th>
                    {model.evidence.primaryMetric === 'monthly-rent' ? <th>Filed deposit</th> : null}
                    <th>Context</th>
                  </tr>
                </thead>
                <tbody>
                  {model.recentTransactions.map((row, index) => (
                    <tr key={`${row.filedMonth}-${row.areaSqm}-${row.primaryWon}-${index}`}>
                      <td>{row.filedMonth}</td>
                      <td>{row.areaLabel}</td>
                      <td>{row.primaryLabel}</td>
                      {model.evidence.primaryMetric === 'monthly-rent'
                        ? <td>{row.filedDepositLabel ?? '—'}</td>
                        : null}
                      <td>{row.contractType ?? (row.floor === null ? 'Reported contract' : `Floor ${row.floor}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <details className={styles.sourceDetails}>
            <summary>Source and publication details</summary>
            <dl className={styles.sourceGrid}>
              <div><dt>Source</dt><dd>MOLIT reported contracts</dd></div>
              <div><dt>Source period</dt><dd>{model.period}</dd></div>
              <div><dt>Generated</dt><dd>{model.generatedAt.slice(0, 10)}</dd></div>
              <div><dt>Publication minimum</dt><dd>5 eligible contracts</dd></div>
            </dl>
          </details>
          <div className={styles.actions}>
            <Link href={backHref}>Return to Explore</Link>
            <Link href="/trust/">Read the evidence policy</Link>
          </div>
        </section>

        <section className={styles.areaBands} aria-labelledby="building-area-prices-heading">
          <div className={styles.sectionHeading}>
            <p>{locale === 'ko' ? '면적별 가격' : 'Price by home size'}</p>
            <h2 id="building-area-prices-heading">{locale === 'ko' ? '같은 건물의 면적 구간을 전환합니다.' : 'Switch between verified size cohorts for this building.'}</h2>
          </div>
          <ul>{Object.entries(areaLabels).map(([id, label]) => <li key={id}>
            <strong>{label}</strong>
            <span>{id === model.selection.areaBand ? `${primaryLabel} · ${model.evidence.medianLabel ?? (locale === 'ko' ? '미확인' : 'Not published')}` : (locale === 'ko' ? '선택하여 근거 확인' : 'Open this evidence cohort')}</span>
            <Link href={localizedSeoulHref(`/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/?transaction=${model.selection.transaction}&area=${id}`, locale)}>{locale === 'ko' ? '이 면적 보기' : 'View size cohort'}</Link>
          </li>)}</ul>
        </section>

        <section className={styles.relatedContext} aria-label={locale === 'ko' ? '계약과 주변 비교' : 'Contract and nearby comparison'}>
          <article><span>{locale === 'ko' ? '신규·갱신 비교' : 'New and renewal comparison'}</span><h2>{locale === 'ko' ? '계약 구분을 섞지 않습니다.' : 'Contract groups stay separate.'}</h2><p>{model.selection.transaction === 'sale' ? (locale === 'ko' ? '매매 신고에는 신규·갱신 구분을 적용하지 않습니다.' : 'New and renewal cohorts do not apply to reported sales.') : (locale === 'ko' ? `현재 선택: ${model.selection.contractGroup}` : `Current cohort: ${model.selection.contractGroup}`)}</p></article>
          <article><span>{locale === 'ko' ? '인근 단지 비교' : 'Nearby buildings'}</span><h2>{locale === 'ko' ? '같은 구의 실제 단지를 비교합니다.' : 'Compare verified buildings in the same district.'}</h2><p>{locale === 'ko' ? '좌표와 동일 기간 가격 근거가 있는 단지만 Explore에서 표시합니다.' : 'Explore shows only buildings with a verified identity and compatible period evidence.'}</p><Link href={localizedSeoulHref(`/kr/seoul/explore/?district=${model.district.slug}`, locale)}>{locale === 'ko' ? '인근 단지 열기' : 'Open nearby buildings'}</Link></article>
        </section>

        <KnownBuildingFacts facts={[
          { label: locale === 'ko' ? '공식 건물명' : 'Official identity', value: model.building.officialName },
          { label: locale === 'ko' ? '지역' : 'Area', value: `${model.building.neighborhoodName} · ${model.district.nameEn}` },
          { label: locale === 'ko' ? '주택 유형' : 'Housing type', value: model.building.housingType },
          { label: locale === 'ko' ? '거래 유형' : 'Transaction', value: transactionLabel },
          { label: locale === 'ko' ? '면적 구간' : 'Area cohort', value: areaLabel },
          { label: locale === 'ko' ? '근거 기간' : 'Evidence period', value: model.period },
        ]} />
        {facts}

        <section className={styles.relatedContext} aria-label={locale === 'ko' ? '입주와 개발 정보' : 'Supply and development context'}>
          <article><span>{locale === 'ko' ? '입주 예정 물량' : 'Scheduled completions'}</span><h2>{locale === 'ko' ? '미확인' : 'Not verified'}</h2><p>{locale === 'ko' ? '이 건물과 직접 연결된 검증 자료가 없으므로 수치를 표시하지 않습니다.' : 'No verified building-linked supply record is attached, so no estimate is shown.'}</p></article>
          <article><span>{locale === 'ko' ? '인근 개발 정보' : 'Nearby development'}</span><h2>{locale === 'ko' ? '미확인' : 'Not verified'}</h2><p>{locale === 'ko' ? '주소와 사업 고유번호가 연결된 뒤에만 공개합니다.' : 'This opens only after an address and official project identity are matched.'}</p></article>
        </section>

        <BuildingLocalContext buildingId={model.building.buildingId} district={model.district.slug} />
      </main>
      <SiteFooter copy={exactEvidenceFooter} />
    </div>
  );
}
