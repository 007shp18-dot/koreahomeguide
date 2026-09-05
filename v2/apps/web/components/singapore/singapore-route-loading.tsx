import { DataStateNotice } from '../market-ui/data-state';
import { SingaporePage, singaporeStyles as styles } from './singapore-shell';

export function SingaporeRouteLoading({ level }: Readonly<{ level: 'segment' | 'project' }>) {
  return <SingaporePage currentHref="/sg/singapore/explore/">
    <section
      className={styles.routeLoading}
      data-singapore-route-loading={level}
      aria-busy="true"
      aria-live="polite"
    >
      <DataStateNotice
        state="loading"
        heading="Loading verified Singapore evidence"
        cause={level === 'segment'
          ? 'Preparing the selected market region.'
          : 'Preparing the selected project and transactions.'}
        actionLabel="Return to Singapore Explore"
        actionHref="/sg/singapore/explore/"
      />
      <div className={styles.routeLoadingGrid} aria-hidden="true">
        <i /><i /><i /><i />
      </div>
    </section>
  </SingaporePage>;
}
