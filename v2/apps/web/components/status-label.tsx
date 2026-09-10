import type { CapabilityState } from '@signedprice/market-core';

export type StatusLabelState = CapabilityState | 'not_built';

export interface StatusLabelProps {
  readonly state: StatusLabelState;
  readonly label: string;
}

export function StatusLabel({ state, label }: StatusLabelProps) {
  return (
    <span
      className={`status-label status-label--${state}`}
      data-state={state}
    >
      {label}
    </span>
  );
}
