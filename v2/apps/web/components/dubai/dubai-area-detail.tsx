import Link from 'next/link';

import type { DubaiSaleDistribution } from '../../lib/dubai/evidence-contract';
import type { DubaiAreaModel, DubaiAreaSegmentModel } from '../../lib/dubai/route-types';
import { DubaiShell } from './dubai-shell';
import styles from './dubai-research.module.css';

const integer = new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 });
const money = (value: number) => `AED\u00a0${integer.format(value)}`;
const perSqm = (value: number) => `${money(value)}/m²`;

function SaleStageCard({
  label,
  distribution,
}: Readonly<{
  label: 'Ready' | 'Off-Plan';
  distribution: DubaiSaleDistribution | null;
}>) {
  return <article className={styles.stageCard}>
    <h3>{label}</h3>
    {distribution === null ? <p>Not published for this area and home type.</p> : <dl>
      <div><dt>Median sale price</dt><dd>{money(distribution.medianPriceAed)}</dd></div>
      <div><dt>Middle half</dt><dd>{money(distribution.priceP25Aed)}–<wbr />{money(distribution.priceP75Aed)}</dd></div>
      <div><dt>Median AED/m²</dt><dd>{perSqm(distribution.medianPricePerSqmAed)}</dd></div>
      <div><dt>Middle-half AED/m²</dt><dd>{perSqm(distribution.pricePerSqmP25Aed)}–<wbr />{perSqm(distribution.pricePerSqmP75Aed)}</dd></div>
      <div><dt>Sample</dt><dd>{distribution.n.toLocaleString('en')} registered sales</dd></div>
    </dl>}
  </article>;
}

function SegmentEvidence({ segment }: Readonly<{ segment: DubaiAreaSegmentModel }>) {
  const housingLabel = segment.housing === 'apartment' ? 'Apartment' : 'Villa';
  return <section className={styles.segmentSection}>
    <p className={styles.eyebrow}>{housingLabel} evidence</p>
    <h2>Ready vs Off-Plan</h2>
    <p>Sale stages remain separate. Their samples are not combined to pass publication thresholds.</p>
    <div className={styles.stageGrid}>
      <SaleStageCard label="Ready" distribution={segment.sales.ready} />
      <SaleStageCard label="Off-Plan" distribution={segment.sales.offPlan} />
    </div>
    <article className={styles.rentCard}>
      <h3>Registered rent evidence</h3>
      <dl>
        <div><dt>Median annual rent</dt><dd>{money(segment.rent.medianAnnualRentAed)}/year</dd></div>
        <div><dt>New-contract sample</dt><dd>{segment.rent.newN.toLocaleString('en')} new rent contracts</dd></div>
        <div><dt>New / renewed mix</dt><dd>{(segment.rent.newShare * 100).toFixed(1)}% / {(segment.rent.renewedShare * 100).toFixed(1)}%</dd></div>
        <div><dt>Estimated gross rent-to-price ratio</dt><dd>{segment.readyGrossYieldPct === null ? 'Not published without Ready evidence' : `${segment.readyGrossYieldPct.toFixed(1)}%`}</dd></div>
      </dl>
      <p>The ratio divides the area’s median new annual rent by its median Ready sale price. It is not a forecast or net return.</p>
    </article>
  </section>;
}

export function DubaiAreaDetail({ model }: Readonly<{ model: DubaiAreaModel }>) {
  const primary = model.segments[0]!;
  const primarySale = primary.sales.ready ?? primary.sales.offPlan!;
  const comparableGroups = model.segments.flatMap((segment) => ([
    { housing: segment.housing, stage: 'ready' as const, areas: segment.comparableAreas.ready },
    { housing: segment.housing, stage: 'off-plan' as const, areas: segment.comparableAreas.offPlan },
  ])).filter(({ areas }) => areas.length > 0);
  return <DubaiShell href="/ae/dubai/explore/">
    <main className={styles.areaPage} data-dubai-area-evidence="ready">
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/ae/dubai/">Dubai</Link><span>/</span>
        <Link href="/ae/dubai/explore/">Explore</Link><span>/</span>
        <span>{model.identity.name}</span>
      </nav>
      <header className={styles.areaHero}>
        <div>
          <p className={styles.eyebrow}>Dubai · Area evidence</p>
          <h1>{model.identity.name}</h1>
          <p>{model.segments.map(({ housing }) => housing === 'apartment' ? 'Apartment' : 'Villa').join(' and ')} sale and registered-rent evidence through {model.context.asOfDate}.</p>
        </div>
        <div className={styles.heroMetric}>
          <small>{primary.sales.ready === null ? 'Off-Plan' : 'Ready'} median sale price</small>
          <strong>{money(primarySale.medianPriceAed)}</strong>
          <span>{primarySale.n.toLocaleString('en')} registered sales</span>
        </div>
      </header>
      <div className={styles.areaSections}>
        <div>{model.segments.map((segment) => <SegmentEvidence key={segment.housing} segment={segment} />)}</div>
        <aside className={styles.areaRail}>
          <section className={styles.sourceCard}>
            <h2>Check an asking price</h2>
            <p>Keep this area and home type selected, then enter the offer, size, and your own expected annual rent.</p>
            <Link className={styles.primaryAction} href={model.checkHref}>Check this asking price</Link>
          </section>
          <section className={styles.sourceCard}>
            <h2>Comparable areas</h2>
            <p>Same home type, sale stage, method, and comparison window—not a geographic-nearness claim.</p>
            <nav className={styles.comparableLinks} aria-label="Comparable Dubai areas">
              {comparableGroups.length === 0 ? <span>No same-cohort comparison is published.</span> : comparableGroups.map((group) => <div key={`${group.housing}-${group.stage}`} data-comparable-stage={group.stage}>
                <strong>{group.housing === 'apartment' ? 'Apartment' : 'Villa'} · {group.stage === 'ready' ? 'Ready' : 'Off-Plan'}</strong>
                {group.areas.map((area) => <Link key={area.id} href={area.href}>{area.name}</Link>)}
              </div>)}
            </nav>
          </section>
          <section className={styles.sourceCard}>
            <h2>Evidence scope</h2>
            <dl>
              <div><dt>Comparison window</dt><dd>{model.context.comparisonPeriod.from}–{model.context.comparisonPeriod.to}</dd></div>
              <div><dt>Transaction source period</dt><dd>{model.context.sourcePeriods.transactions.from}–{model.context.sourcePeriods.transactions.to}</dd></div>
              <div><dt>Rent source period</dt><dd>{model.context.sourcePeriods.rents.from}–{model.context.sourcePeriods.rents.to}</dd></div>
              <div><dt>Publication minimum</dt><dd>{model.context.publicationMinimum} records per displayed cohort</dd></div>
            </dl>
            <p>{model.context.attribution}</p>
            <p><a href={model.context.sourceUrl} target="_blank" rel="noreferrer">DLD source page</a> · <a href={model.context.licenseUrl} target="_blank" rel="noreferrer">Dataset licence</a></p>
            <p>Gross ratios exclude service charges, vacancy, financing, taxes, acquisition costs, repairs, and management.</p>
            <p><Link href="/trust/">Method and corrections</Link></p>
          </section>
        </aside>
      </div>
    </main>
  </DubaiShell>;
}
