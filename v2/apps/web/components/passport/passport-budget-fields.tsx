'use client';

import { useState } from 'react';
import { amountStepValid } from '../../lib/format/amount-input';
import { AmountInput } from '../amount-input';
import { convertPassportCurrency, normalizePassportCurrency, PASSPORT_BUDGET_CURRENCIES, type PassportBudgetCurrency, type PassportLocale } from '../../lib/passport/model';
import { PASSPORT_FX, type PassportFxSnapshot } from '../../lib/passport/fx';
import styles from './passport.module.css';

export function PassportBudgetFields({ amount, currency, locale, id, fx }: Readonly<{ amount: number; currency: PassportBudgetCurrency; locale: PassportLocale; id: string; fx?: PassportFxSnapshot }>) {
  const rates = fx ?? PASSPORT_FX;
  const [selected, setSelected] = useState(currency);
  const [value, setValue] = useState(new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount));
  const [touched, setTouched] = useState(false);
  const min = Math.ceil(convertPassportCurrency(10_000_000, 'KRW', selected, rates) * 100) / 100;
  const max = Math.floor(convertPassportCurrency(100_000_000_000, 'KRW', selected, rates) * 100) / 100;
  const parsed = Number(value.replaceAll(',', ''));
  const invalid = value.trim() === '' || !Number.isFinite(parsed) || parsed < min || parsed > max || !amountStepValid(value, 0.01, min);
  const money = (amount: number) => `${selected} ${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount)}`;
  const help = locale === 'ko' ? '보유 현금이나 대출 한도가 아닌 매매가격 기준 예산입니다. 세금·수수료는 별도입니다.' : locale === 'zh-CN' ? '用于比较购房价格，不代表可用现金或贷款额度。税费另计。' : 'A purchase-price budget, not your cash savings or borrowing limit. Taxes and fees are separate.';
  const range = `${money(min)} – ${money(max)}`;
  const error = locale === 'ko' ? `${range} 범위에서 소수점 둘째 자리까지 입력해 주세요.` : locale === 'zh-CN' ? `请输入 ${range} 范围内的预算，最多两位小数。` : `Enter a budget from ${range}, with up to two decimal places.`;
  return <>
    <label htmlFor={id}>{locale === 'ko' ? '예산' : locale === 'zh-CN' ? '预算' : 'Budget'}</label>
    <div className={styles.inputFrame}>
      <select name="currency" aria-label={locale === 'ko' ? '예산 통화' : locale === 'zh-CN' ? '预算币种' : 'Budget currency'} value={selected} onChange={(event) => {
        const next = normalizePassportCurrency(event.target.value);
        if (value.trim() !== '') setValue(new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(convertPassportCurrency(parsed, selected, next, rates)));
        setSelected(next);
      }}>{PASSPORT_BUDGET_CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}</select>
      <AmountInput id={id} name="budget" placeholder={new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(convertPassportCurrency(amount, currency, selected, rates))} value={value} required min={min} max={max} step={0.01} aria-describedby={`${id}-help ${id}-error`} aria-invalid={touched && invalid} onInvalid={() => setTouched(true)} onValueChange={next => { setValue(next); setTouched(true); }} />
    </div>
    <small id={`${id}-help`} className={styles.budgetHelp}>{help}</small>
    <small id={`${id}-error`} className={styles.budgetHelp} role={touched && invalid ? 'status' : undefined}>{touched && invalid ? error : null}</small>
    {fx === undefined && selected !== currency ? <small>{locale === 'ko' ? '저장된 참고 환율' : locale === 'zh-CN' ? '已保存的参考汇率' : 'Saved reference FX'} · {rates.asOf}</small> : null}
  </>;
}
