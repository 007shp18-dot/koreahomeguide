import Link from 'next/link';

import type { PublicBuildingModel } from '../../lib/public-market/building-route-model.server';
import { EvidenceSectionHeading } from '../evidence-ui/section-heading';
import { EvidenceDisclosure } from '../trust/evidence-disclosure';
import { EvidencePeriodStrip } from './evidence-period-strip';
import styles from './building-detail.module.css';

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

function contractTypeLabel(value: 'new' | 'renewal' | 'unknown'): string {
  if (value === 'new') return 'New';
  if (value === 'renewal') return 'Renewal';
  return 'Unclassified';
}

function floorLabel(contract: PublicBuildingModel['building']['recentContracts'][number]): string {
  if (contract.floor !== null) return String(contract.floor);
  return 'Floor was not retained in this verified snapshot.';
}

function CohortEvidence({ model }: Readonly<{ model: PublicBuildingModel }>) {
  return (
    <section className={styles.evidence} aria-labelledby="building-distribution-heading">
      <EvidenceSectionHeading
        eyebrow="01 / Reported distribution"
        title={model.presentation.distributionHeading}
        id="building-distribution-heading"
      />
      <EvidencePeriodStrip model={model.period} label="Building evidence period" />
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
  );
}

function FloorEvidence({ model }: Readonly<{ model: PublicBuildingModel }>) {
  return (
    <section className={styles.areaBands} aria-labelledby="floor-coefficient-heading">
      <EvidenceSectionHeading
        eyebrow="02 / Floor evidence"
        title="Floor adjustment evidence"
        id="floor-coefficient-heading"
      />
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
  );
}

function AreaBandEvidence({ model }: Readonly<{ model: PublicBuildingModel }>) {
  return (
    <section className={styles.areaBands} aria-labelledby="building-area-heading">
      <EvidenceSectionHeading
        eyebrow="03 / Area bands"
        title="Evidence by filed area band"
        id="building-area-heading"
      />
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
  );
}

function RecentContractEvidence({ model }: Readonly<{ model: PublicBuildingModel }>) {
  return (
    <section className={styles.contracts} aria-labelledby="recent-contracts-heading">
      <EvidenceSectionHeading
        eyebrow="04 / Recent records"
        title="Privacy-safe reported contracts"
        id="recent-contracts-heading"
      />
      {model.building.recentContracts.length === 0 ? (
        <p>No recent public contract rows are included in this artifact.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Filed month</th>
                <th>Area</th>
                <th>Floor</th>
                <th>Contract</th>
                <th>Jeonse deposit</th>
              </tr>
            </thead>
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
  );
}

function BuildingSourceEvidence({ model }: Readonly<{ model: PublicBuildingModel }>) {
  return (
    <section className={styles.source} aria-labelledby="building-source-heading">
      <EvidenceSectionHeading
        eyebrow="05 / Source and limits"
        title="Use this evidence within its boundary"
        id="building-source-heading"
      />
      <EvidenceDisclosure
        model={model.evidence.descriptor}
        boundary={model.presentation.sourceBoundary}
        attribution={['Ministry of Land, Infrastructure and Transport (MOLIT)']}
      />
      <details className={styles.sourceDetails}>
        <summary>Filters and publication rules</summary>
        <dl className={styles.sourceGrid}>
          <div><dt>Supported deals</dt><dd>jeonse</dd></div>
          <div><dt>{model.presentation.periodLabel}</dt><dd>{model.evidence.period}</dd></div>
          <div><dt>Publication minimum</dt><dd>{model.evidence.publicationMinimum}</dd></div>
          <div><dt>Exclusions</dt><dd>{model.evidence.exclusions.join(' · ')}</dd></div>
        </dl>
      </details>
      <div className={styles.actions}>
        <Link href="/trust/">Read SignedPrice Trust</Link>
        <Link href="/kr/seoul/corrections/">Review Seoul corrections</Link>
      </div>
    </section>
  );
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

export function BuildingEvidenceDetails({ model }: Readonly<{ model: PublicBuildingModel }>) {
  return (
    <details className={styles.evidenceDetails} data-building-section="evidence">
      <summary>See records, adjustments, and methodology</summary>
      <div className={styles.evidenceDetailsBody}>
        <CohortEvidence model={model} />
        <FloorEvidence model={model} />
        <AreaBandEvidence model={model} />
        <RecentContractEvidence model={model} />
        <BuildingSourceEvidence model={model} />
        <BuildingNavigation model={model} />
      </div>
    </details>
  );
}
