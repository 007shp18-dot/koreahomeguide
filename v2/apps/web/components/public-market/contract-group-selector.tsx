import Link from 'next/link';

import type { ContractGroupEvidenceModel } from '../../lib/public-market/area-route-types';
import {
  PUBLIC_MARKET_COPY,
  localizedGroupLabel,
  type ProductLocale,
} from '../../lib/locale/product-copy';
import styles from './contract-group-selector.module.css';

const groups = ['all', 'new', 'renewal'] as const;

export function ContractGroupSelector({
  model,
  selectionHref,
  locale = 'en',
}: Readonly<{
  model: ContractGroupEvidenceModel;
  selectionHref: string;
  locale?: ProductLocale;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].summary;
  return (
    <div className={styles.wrapper}>
      <div className={styles.selector} role="group" aria-label={copy.selectorAria}>
        {groups.map((group) => {
          const disabled = group !== 'all' && model.splitStatus !== 'ready';
          const href = group === 'all'
            ? selectionHref
            : `${selectionHref}${selectionHref.includes('?') ? '&' : '?'}contractType=${group}`;
          return disabled ? (
            <button
              key={group}
              type="button"
              data-contract-group={group}
              aria-pressed={false}
              disabled
            >
              {localizedGroupLabel(group, locale).replace(locale === 'en' ? ' contracts' : ' 계약', '')}
            </button>
          ) : (
            <Link
              key={group}
              href={href}
              role="button"
              data-contract-group={group}
              aria-pressed={model.selected === group}
            >
              {localizedGroupLabel(group, locale).replace(locale === 'en' ? ' contracts' : ' 계약', '')}
            </Link>
          );
        })}
      </div>
      {model.splitStatus === 'snapshot_v1' ? (
        <p className={styles.limitation}>
          {copy.splitUnavailable}
        </p>
      ) : null}
    </div>
  );
}
