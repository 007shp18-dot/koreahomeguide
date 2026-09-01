import Link from 'next/link';

import type { PublicBuildingModel } from '../../lib/public-market/building-route-model.server';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '../../lib/site-copy';
import { SiteFooter } from '../site-footer';
import { SiteHeader } from '../site-header';
import { CommunitySignal } from '../community/community-signal';
import { DetailNewsList } from '../news/detail-news-list';
import { EvidenceDisclosure } from '../trust/evidence-disclosure';
import { BoxPlot } from './box-plot';
import { EvidencePeriodStrip } from './evidence-period-strip';
import { PublicSectionTabs } from './public-section-tabs';
import styles from './building-detail.module.css';

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0,
});

function headerFor(model: PublicBuildingModel): SiteHeaderModel {
  return {
    brand: 'signedprice',
    homeLabel: 'signedprice home',
    navigationLabel: `${model.building.name} evidence navigation`,
    links: [
      { label: 'Global home', href: '/' },
      { label: 'Seoul market', href: '/kr/seoul/' },
      { label: 'District Explorer', href: '/kr/seoul/explore/' },
    ],
  };
}

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Verified Seoul building evidence, with publication limits shown.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

function contractTypeLabel(value: 'new' | 'renewal' | 'unknown'): string {
  if (value === 'new') return 'New';
  if (value === 'renewal') return 'Renewal';
  return 'Unclassified';
}

function floorLabel(contract: PublicBuildingModel['building']['recentContracts'][number]): string {
  if (contract.floor !== null) return String(contract.floor);
  return 'Floor was not retained in this verified snapshot.';
}

function BuildingNavigation({ model }: Readonly<{ model: PublicBuildingModel }>) {
  return (
    <nav className={styles.navigation} aria-label="Building evidence navigation">
      <Link href={`/kr/seoul/explore/${model.district.slug}/`}>
        Back to {model.district.nameEn} evidence
      </Link>
      <Link href={`/kr/seoul/explore/?district=${model.district.slug}`}>
        Back to Seoul map
      </Link>
      <Link href="/kr/seoul/rankings/">View district rankings</Link>
      <Link href="/kr/seoul/corrections/">Review Seoul corrections</Link>
    </nav>
  );
}

export function BuildingDetailPage({ model }: Readonly<{ model: PublicBuildingModel }>) {
  return (
    <div id="top" className={styles.page} data-building-detail="ready">
      <SiteHeader copy={headerFor(model)} />
      <PublicSectionTabs current="explore" />
      <main className={styles.main}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <ol>
            <li><Link href="/kr/seoul/explore/">Explore</Link></li>
            <li>
              <Link href={`/kr/seoul/explore/${model.district.slug}/`}>
                {model.district.nameEn}
              </Link>
            </li>
            <li aria-current="page">{model.building.name}</li>
          </ol>
        </nav>

        <header className={styles.hero}>
          <p>{model.district.nameEn} · Verified building evidence</p>
          <h1>{model.building.name}</h1>
          <p>{model.building.housingType} · {model.display.sampleLabel}</p>
        </header>

        <div className={styles.detailLayout}>
          <div className={styles.detailMain} data-detail-main="true">
            <section className={styles.evidence} aria-labelledby="building-distribution-heading">
              <div className={styles.sectionHeading}>
                <p>01 / Reported distribution</p>
                <h2 id="building-distribution-heading">{model.presentation.distributionHeading}</h2>
              </div>
              <EvidencePeriodStrip model={model.period} label="Building evidence period" />
              <div data-building-distribution="true">
                <BoxPlot
                  summary={model.distribution}
                  axis={model.plotAxis}
                  formatValue={(value) => money.format(value)}
                />
              </div>
              <dl className={styles.findingGrid}>
                <div>
                  <dt>Recent change</dt>
                  <dd>
                    <strong>{model.display.changeLabel}</strong>
                    {model.display.change.reasons.map((reason) => (
                      <span key={reason}>{reason}</span>
                    ))}
                  </dd>
                </div>
              </dl>
              <dl className={styles.findingGrid} aria-label="Contract type evidence">
                <div>
                  <dt>New contracts</dt>
                  <dd>{model.building.groups.new.published
                    ? `${money.format(model.building.groups.new.med)} · ${model.building.groups.new.n} records`
                    : `Not published · ${model.building.groups.new.n} records`}</dd>
                </div>
                <div>
                  <dt>Renewal contracts</dt>
                  <dd>{model.building.groups.renewal.published
                    ? `${money.format(model.building.groups.renewal.med)} · ${model.building.groups.renewal.n} records`
                    : `Not published · ${model.building.groups.renewal.n} records`}</dd>
                </div>
                <div><dt>Unclassified type</dt><dd>{model.building.unknownContractCount} records</dd></div>
              </dl>
            </section>

            <section className={styles.areaBands} aria-labelledby="floor-coefficient-heading">
              <div className={styles.sectionHeading}>
                <p>02 / Floor evidence</p>
                <h2 id="floor-coefficient-heading">Floor adjustment evidence</h2>
              </div>
              <div data-floor-coefficient={model.floorCoefficient.status}>
                {model.floorCoefficient.status === 'unavailable' ? (
                  <strong>{model.floorCoefficient.reason}</strong>
                ) : (
                  <strong>{model.floorCoefficient.coefficient}</strong>
                )}
                <p>{model.floorCoefficient.pairCount} eligible pairs</p>
                <p>{model.floorCoefficient.basis}</p>
              </div>
            </section>

            <section className={styles.areaBands} aria-labelledby="building-area-heading">
              <div className={styles.sectionHeading}>
                <p>03 / Area bands</p>
                <h2 id="building-area-heading">Evidence by filed area band</h2>
              </div>
              {model.building.areaBands.length === 1
                && model.building.areaBands[0]?.band === '45–55㎡' ? (
                <div data-area-band-state="single-fixed-band">
                  <strong>Other floor-area bands are not available yet.</strong>
                  <p>Published contract evidence is currently fixed to the 45–55㎡ floor-area band.</p>
                  <p>Additional bands will open after the collection scope expands.</p>
                </div>
              ) : model.building.areaBands.length === 0 ? (
                <p>No area-band distribution is published for this record.</p>
              ) : (
                <ul>
                  {model.building.areaBands.map(({ band, summary }) => (
                    <li key={band}>
                      <strong>{band}</strong>
                      <span>{summary.n} reported contract{summary.n === 1 ? '' : 's'}</span>
                      <span>{summary.published ? money.format(summary.med) : 'Not published'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={styles.contracts} aria-labelledby="recent-contracts-heading">
              <div className={styles.sectionHeading}>
                <p>04 / Recent records</p>
                <h2 id="recent-contracts-heading">Privacy-safe reported contracts</h2>
              </div>
              {model.building.recentContracts.length === 0 ? (
                <p>No recent public contract rows are included in this artifact.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table>
                    <thead><tr><th>Filed month</th><th>Area</th><th>Floor</th><th>Contract</th><th>Jeonse deposit</th></tr></thead>
                    <tbody>
                      {model.building.recentContracts.map((contract, index) => (
                        <tr key={`${contract.filedMonth}-${contract.areaSqm}-${index}`}>
                          <td>{contract.filedMonth}</td>
                          <td>{contract.areaSqm}㎡</td>
                          <td>{floorLabel(contract)}</td>
                          <td>{contractTypeLabel(contract.contractType)}</td>
                          <td>{money.format(contract.depositWon)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className={styles.source} aria-labelledby="building-source-heading">
              <div className={styles.sectionHeading}>
                <p>05 / Source and limits</p>
                <h2 id="building-source-heading">Use this evidence within its boundary</h2>
              </div>
              <EvidenceDisclosure
                model={model.evidence.descriptor}
                boundary={model.presentation.sourceBoundary}
                attribution={['Ministry of Land, Infrastructure and Transport (MOLIT)']}
              />
              <dl className={styles.sourceGrid}>
                <div><dt>Supported deals</dt><dd>jeonse</dd></div>
                <div><dt>{model.presentation.periodLabel}</dt><dd>{model.evidence.period}</dd></div>
                <div><dt>Publication minimum</dt><dd>{model.evidence.publicationMinimum}</dd></div>
                <div><dt>Exclusions</dt><dd>{model.evidence.exclusions.join(' · ')}</dd></div>
              </dl>
              <div className={styles.actions}>
                <Link href="/trust/">Read SignedPrice Trust</Link>
                <Link href="/kr/seoul/corrections/">Review Seoul corrections</Link>
              </div>
            </section>
          </div>
          <aside className={styles.detailRail} data-detail-rail="true" aria-label="Building context">
            <DetailNewsList news={model.news} />
            <CommunitySignal model={model.communitySignal} />
            <BuildingNavigation model={model} />
          </aside>
        </div>
      </main>
      <SiteFooter copy={footer} />
    </div>
  );
}
