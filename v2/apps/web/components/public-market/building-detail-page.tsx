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
                <h2 id="building-distribution-heading">Completed-period contract evidence</h2>
              </div>
              <dl className={styles.findingGrid}>
                <div><dt>Median</dt><dd>{model.display.medianLabel}</dd></div>
                <div><dt>Middle half</dt><dd>{model.display.middleHalfLabel}</dd></div>
                <div><dt>Full range</dt><dd>{model.display.rangeLabel}</dd></div>
                <div><dt>Recent change</dt><dd>{model.display.changeLabel}</dd></div>
              </dl>
            </section>

            <section className={styles.areaBands} aria-labelledby="building-area-heading">
              <div className={styles.sectionHeading}>
                <p>02 / Area bands</p>
                <h2 id="building-area-heading">Evidence by filed area band</h2>
              </div>
              {model.building.areaBands.length === 0 ? (
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
                <p>03 / Recent records</p>
                <h2 id="recent-contracts-heading">Privacy-safe reported contracts</h2>
              </div>
              {model.building.recentContracts.length === 0 ? (
                <p>No recent public contract rows are included in this artifact.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table>
                    <thead><tr><th>Filed month</th><th>Area</th><th>Contract</th><th>Jeonse deposit</th></tr></thead>
                    <tbody>
                      {model.building.recentContracts.map((contract, index) => (
                        <tr key={`${contract.filedMonth}-${contract.areaSqm}-${index}`}>
                          <td>{contract.filedMonth}</td>
                          <td>{contract.areaSqm}㎡</td>
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
                <p>04 / Source and limits</p>
                <h2 id="building-source-heading">Use this evidence within its boundary</h2>
              </div>
              <EvidenceDisclosure
                model={model.evidence.descriptor}
                boundary="Completed-period reported building contracts, not a listing, appraisal, or legal review."
                attribution={['Ministry of Land, Infrastructure and Transport (MOLIT)']}
              />
              <dl className={styles.sourceGrid}>
                <div><dt>Supported deals</dt><dd>jeonse</dd></div>
                <div><dt>Completed period</dt><dd>{model.evidence.period}</dd></div>
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
