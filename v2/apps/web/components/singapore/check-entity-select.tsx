'use client';

import { useSyncExternalStore } from 'react';

type Option = readonly [value: string, label: string];
const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

// Thousands of native options otherwise travel twice: as HTML and as React
// server elements. Send their compact values once and populate after hydration.
// Keep the selected label visible while the rest of the form is preparing.
export function CheckEntitySelect({ name, options, defaultValue = '', anyLabel }: Readonly<{
  name: string;
  options: readonly Option[];
  defaultValue?: string;
  anyLabel: string;
}>) {
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const selected = options.find(([value]) => value === defaultValue);
  const visibleOptions = ready ? options : selected ? [selected] : [];
  return <select name={name} defaultValue={defaultValue} aria-busy={!ready}>
    <option value="">{anyLabel}</option>
    {visibleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
  </select>;
}
