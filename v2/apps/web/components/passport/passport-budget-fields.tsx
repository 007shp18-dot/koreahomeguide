'use client';

import { useState } from 'react';
import { convertPassportCurrency, normalizePassportAmount, normalizePassportCurrency, PASSPORT_BUDGET_CURRENCIES, type PassportBudgetCurrency, type PassportLocale } from '../../lib/passport/model';
import styles from './passport.module.css';

export function PassportBudgetFields({ amount, currency, locale, id }: Readonly<{ amount: number; currency: PassportBudgetCurrency; locale: PassportLocale; id: string }>) {
  const [selected, setSelected] = useState(currency);
  const [value, setValue] = useState(new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount));
  return <>
    <label htmlFor={id}>{locale === 'ko' ? '예산' : locale === 'zh-CN' ? '预算' : 'Budget'}</label>
    <div className={styles.inputFrame}>
      <select name="currency" aria-label={locale === 'ko' ? '예산 통화' : locale === 'zh-CN' ? '预算币种' : 'Budget currency'} value={selected} onChange={(event) => {
        const next = normalizePassportCurrency(event.target.value);
        setValue(new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(convertPassportCurrency(normalizePassportAmount(value, selected), selected, next)));
        setSelected(next);
      }}>{PASSPORT_BUDGET_CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}</select>
      <input id={id} name="budget" inputMode="decimal" placeholder={new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(convertPassportCurrency(amount, currency, selected))} value={value} onChange={(event) => setValue(event.target.value)} />
    </div>
  </>;
}
