import styles from './public-market.module.css';

export type StrokeStateName = 'filled' | 'outlined' | 'hatched' | 'hairline';

export function StrokeState({ state, label }: Readonly<{
  state: StrokeStateName;
  label: string;
}>) {
  return (
    <span className={styles.strokeState} data-stroke-state={state}>
      <span
        className={`${styles.strokeSwatch} ${styles[state]}`}
        aria-hidden="true"
      />
      <span className={styles.strokeLabel}>{label}</span>
    </span>
  );
}
