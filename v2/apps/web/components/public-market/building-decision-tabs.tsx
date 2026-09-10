import Link from 'next/link';
import { seoulDetailText } from '../../lib/locale/seoul-detail-copy';
import type { ProductLocale } from '../../lib/locale/product-copy';

import {
  BUILDING_CONTRACT_COHORTS,
  BUILDING_DECISION_MODES,
  buildingDecisionHref,
  type BuildingContractCohort,
  type BuildingDecisionMode,
  type BuildingDecisionSelection,
} from '../../lib/public-market/building-decision-state';
import styles from './building-detail.module.css';

const MODE_LABELS = {
  overview: 'Overview',
  rent: 'Rent',
  buy: 'Buy',
  invest: 'Invest',
  evidence: 'Evidence',
} as const satisfies Readonly<Record<BuildingDecisionMode, string>>;

const COHORT_LABELS = {
  all: 'All',
  new: 'New',
  renewal: 'Renewal',
} as const satisfies Readonly<Record<BuildingContractCohort, string>>;

export function BuildingDecisionTabs({ base, selection, locale = 'en' }: Readonly<{
  locale?: ProductLocale;
  base: string;
  selection: BuildingDecisionSelection;
}>) {
  return (
    <nav className={styles.decisionTabs} aria-label={seoulDetailText(locale, 'Building decision mode')}>
      <div role="tablist">
        {BUILDING_DECISION_MODES.map((mode) => (
          <Link
            key={mode}
            id={`building-mode-${mode}-tab`}
            href={buildingDecisionHref({ base, mode, contract: selection.contract })}
            role="tab"
            aria-selected={selection.mode === mode}
            aria-controls="building-mode-panel"
          >
            {seoulDetailText(locale, MODE_LABELS[mode])}
          </Link>
        ))}
      </div>
      {selection.mode === 'rent' ? (
        <div role="group" aria-label={seoulDetailText(locale, 'Rent contract cohort')}>
          {BUILDING_CONTRACT_COHORTS.map((contract) => (
            <Link
              key={contract}
              href={buildingDecisionHref({ base, mode: 'rent', contract })}
              role="button"
              aria-pressed={selection.contract === contract}
            >
              {seoulDetailText(locale, COHORT_LABELS[contract])}
            </Link>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
