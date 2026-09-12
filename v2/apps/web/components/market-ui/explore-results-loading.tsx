import styles from './explore-controls.module.css';

export function ExploreResultsLoading({ label }: { label: string }) {
  return <section className={styles.loading} role="status">
    <p>{label}</p>
    <div aria-hidden="true">{[0, 1, 2].map(row => <div className={styles.loadingRow} key={row}><span /><span /></div>)}</div>
  </section>;
}
