import styles from './district-detail.module.css';

export function SampleChip({
  label,
  state,
}: Readonly<{
  label: string;
  state: 'published' | 'withheld';
}>) {
  return (
    <span className={styles.sampleChip} data-sample-state={state}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}
