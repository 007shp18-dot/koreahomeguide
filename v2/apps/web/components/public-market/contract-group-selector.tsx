import Link from 'next/link';

import type { ContractGroupEvidenceModel } from '../../lib/public-market/area-route-types';
import styles from './contract-group-selector.module.css';

const groups = ['all', 'new', 'renewal'] as const;

export function ContractGroupSelector({
  model,
  selectionHref,
}: Readonly<{
  model: ContractGroupEvidenceModel;
  selectionHref: string;
}>) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.selector} role="group" aria-label="Contract type evidence">
        {groups.map((group) => {
          const evidence = model.groups[group];
          const disabled = group !== 'all' && model.splitStatus !== 'ready';
          const href = group === 'all'
            ? selectionHref
            : `${selectionHref}${selectionHref.includes('?') ? '&' : '?'}contract=${group}`;
          return disabled ? (
            <button
              key={group}
              type="button"
              data-contract-group={group}
              aria-pressed={false}
              disabled
            >
              {evidence.groupLabel.replace(' contracts', '')}
            </button>
          ) : (
            <Link
              key={group}
              href={href}
              role="button"
              data-contract-group={group}
              aria-pressed={model.selected === group}
            >
              {evidence.groupLabel.replace(' contracts', '')}
            </Link>
          );
        })}
      </div>
      {model.splitStatus === 'snapshot_v1' ? (
        <p className={styles.limitation}>
          New/renewal split not available in this snapshot
        </p>
      ) : null}
    </div>
  );
}
