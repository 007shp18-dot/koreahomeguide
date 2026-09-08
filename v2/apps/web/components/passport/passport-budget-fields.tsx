'use client';

import { useState } from 'react';
import { convertPassportCurrency, normalizePassportAmount, normalizePassportCurrency, PASSPORT_BUDGET_CURRENCIES, type PassportBudgetCurrency, type PassportLocale } from '../../lib/passport/model';
import { PASSPORT_FX, type PassportFxSnapshot } from '../../lib/passport/fx';
import styles from './passport.module.css';

export function PassportBudgetFields({ amount, currency, locale, id, fx }: Readonly<{ amount: number; currency: PassportBudgetCurrency; locale: PassportLocale; id: string; fx?: PassportFxSnapshot }>) {
  const rates = fx ?? PASSPORT_FX;
  const [selected, setSelected] = useState(currency);
  const [value, setValue] = useState(new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount));
  return <>
    <label htmlFor={id}>{locale === 'ko' ? '예산' : locale === 'zh-CN' ? '预算' : 'Budget'}</label>
    <div className={styles.inputFrame}>
      <select name="currency" aria-label={locale === 'ko' ? '예산 통화' : locale === 'zh-CN' ? '预算币种' : 'Budget currency'} value={selected} onChange={(event) => {
        const next = normalizePassportCurrency(event.target.value);
        setValue(new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(convertPassportCurrency(normalizePassportAmount(value, selected, rates), selected, next, rates)));
        setSelected(next);
      }}>{PASSPORT_BUDGET_CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}</select>
      <input id={id} name="budget" inputMode="decimal" placeholder={new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(convertPassportCurrency(amount, currency, selected, rates))} value={value} onChange={(event) => setValue(event.target.value)} />
    </div>
    {fx === undefined && selected !== currency ? <small>{locale === 'ko' ? '저장된 참고 환율' : locale === 'zh-CN' ? '已保存的参考汇率' : 'Saved reference FX'} · {rates.asOf}</small> : null}
  </>;
}
