'use client';

import { useEffect, useLayoutEffect, useRef, useState, type InputHTMLAttributes } from 'react';
import { amountCaretPosition, formatAmountInput, rawAmountInput, submittedAmountInput, amountStepValid } from '../lib/format/amount-input';

type AmountInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'type'> & {
  value: string | number;
  onValueChange: (value: string) => void;
  resetValue?: string | number;
};

export function AmountInput({ value, onValueChange, name, resetValue, ...props }: AmountInputProps) {
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const display = formatAmountInput(value);
  useEffect(() => {
    const form = input.current?.form;
    if (resetValue === undefined || !form) return;
    const reset = () => onValueChange(String(resetValue));
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [resetValue, onValueChange]);
  useLayoutEffect(() => {
    const raw = rawAmountInput(String(value));
    const numeric = Number(raw);
    const outsideRange = raw !== '' && raw !== null && ((props.min !== undefined && numeric < Number(props.min)) || (props.max !== undefined && numeric > Number(props.max)));
    const ko = input.current?.closest('[lang]')?.getAttribute('lang')?.startsWith('ko');
    const invalidStep = !amountStepValid(String(value), props.step, props.min);
    input.current?.setCustomValidity(outsideRange ? (ko ? '입력 가능한 범위의 숫자를 입력해 주세요.' : 'Enter a number within the allowed range.') : invalidStep ? (ko ? `입력 단위 ${props.step}에 맞는 숫자를 입력해 주세요.` : `Enter a number in steps of ${props.step}.`) : '');
    if (caret.current === null || !input.current) return;
    const position = amountCaretPosition(display, caret.current);
    input.current.setSelectionRange(position, position);
    caret.current = null;
  }, [display, value, props.min, props.max, props.step]);
  return <>
    {name ? <input type="hidden" name={name} disabled={props.disabled} form={props.form} value={submittedAmountInput(String(value))} /> : null}
    <input {...props} data-amount-name={name} ref={input} type="text" inputMode={props.inputMode ?? (Number(props.step) === 1 ? 'numeric' : 'decimal')} value={display} onChange={event => {
      const raw = rawAmountInput(event.target.value);
      if (raw === null) return;
      caret.current = event.target.value.slice(0, event.target.selectionStart ?? event.target.value.length).replace(/,/g, '').length;
      onValueChange(raw);
    }} />
  </>;
}

type DefaultProps = Omit<AmountInputProps, 'value' | 'onValueChange' | 'resetValue'> & { defaultValue?: string | number };
export function DefaultAmountInput({ defaultValue = '', ...props }: DefaultProps) {
  return <DefaultAmountState key={String(defaultValue)} defaultValue={defaultValue} {...props} />;
}
function DefaultAmountState({ defaultValue = '', step = 1, ...props }: DefaultProps) {
  const [value, setValue] = useState(defaultValue);
  return <AmountInput {...props} step={step} resetValue={defaultValue} value={value} onValueChange={setValue} />;
}
