import Link from 'next/link';
import type { ReactNode } from 'react';

import type { ObservedBuildingIdentityModel } from '../../lib/public-market/observed-building-route-model.server';
import type { KoreaExplorerBuildingDetailModel } from '../../lib/public-market/korea-explorer-evidence.server';
import type { ProductLocale } from '../../lib/locale/product-copy';
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

        {facts}

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
          <dl className={styles.sourceGrid}>
            <div><dt>Source</dt><dd>{model.source.provider} {model.source.dataset}</dd></div>
            <div><dt>Source period</dt><dd>{model.source.period}</dd></div>
            <div><dt>Observed first</dt><dd>{model.observations.firstMonth}</dd></div>
            <div><dt>Observed latest</dt><dd>{model.observations.lastMonth}</dd></div>
          </dl>
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
  all: 'All filed areas',
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

        {facts}

        <section className={styles.evidence} data-building-section="exact-evidence">
          <div className={styles.sectionHeading}>
            <p>{transactionLabel} · {areaLabel}</p>
            <h2>{publicationHeading}</h2>
          </div>
          <dl className={styles.findingGrid}>
            <div><dt>{primaryLabel}</dt><dd>{model.evidence.medianLabel ?? 'Not published'}</dd></div>
            <div><dt>Middle half</dt><dd>{model.evidence.middleHalfLabel ?? 'Not published'}</dd></div>
            <div><dt>Observed range</dt><dd>{model.evidence.rangeLabel ?? 'Not published'}</dd></div>
            <div><dt>Sample</dt><dd>{model.evidence.sampleLabel}</dd></div>
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

          <dl className={styles.sourceGrid}>
            <div><dt>Source</dt><dd>MOLIT reported contracts</dd></div>
            <div><dt>Source period</dt><dd>{model.period}</dd></div>
            <div><dt>Generated</dt><dd>{model.generatedAt.slice(0, 10)}</dd></div>
            <div><dt>Publication minimum</dt><dd>5 eligible contracts</dd></div>
          </dl>
          <div className={styles.actions}>
            <Link href={backHref}>Return to Explore</Link>
            <Link href="/trust/">Read the evidence policy</Link>
          </div>
        </section>
      </main>
      <SiteFooter copy={exactEvidenceFooter} />
    </div>
  );
}
