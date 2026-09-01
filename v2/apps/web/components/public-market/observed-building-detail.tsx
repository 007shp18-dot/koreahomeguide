import Link from 'next/link';

import type { ObservedBuildingIdentityModel } from '../../lib/public-market/observed-building-route-model.server';
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
