import Link from 'next/link';

import type { ObservedBuildingIdentityModel } from '../../lib/public-market/observed-building-route-model.server';
import type { KoreaExplorerBuildingDetailModel } from '../../lib/public-market/korea-explorer-evidence.server';
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

export function ObservedBuildingDetail({
  model,
  backHref,
}: Readonly<{
  model: ObservedBuildingIdentityModel;
  backHref: string;
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
          <div className={styles.visualUnavailable} data-building-media="identity-evidence">
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
          </div>
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
}: Readonly<{
  model: KoreaExplorerBuildingDetailModel;
  backHref: string;
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
      <main className={styles.main} data-building-detail="exact-evidence">
        <section
          className={styles.identityHero}
          data-identity-hero="true"
          data-building-section="identity"
        >
          <div className={styles.visualUnavailable} data-building-media="exact-cohort-evidence">
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
          </div>
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
