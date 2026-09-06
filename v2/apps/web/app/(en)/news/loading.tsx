import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import styles from '@/components/newsroom/newsroom.module.css';

export default function NewsLoading() {
  return <EditorialGrowthPublicFrame locale="en" surface="content">
    <main className={styles.loading} aria-busy="true" aria-live="polite">
      <h1>News</h1>
      <p>Loading articles…</p>
    </main>
  </EditorialGrowthPublicFrame>;
}
