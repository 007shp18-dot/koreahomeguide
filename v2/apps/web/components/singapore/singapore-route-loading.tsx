
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import { DataStateNotice } from '../market-ui/data-state';
import { SingaporePage, singaporeStyles as styles } from './singapore-shell';

export function SingaporeRouteLoading({ locale = 'en', level }: Readonly<{ locale?: MarketLocale; level: 'segment' | 'project' }>) {
  return <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")}>
    <section
      className={styles.routeLoading}
      data-singapore-route-loading={level}
      aria-busy="true"
      aria-live="polite"
    >
      <DataStateNotice
        state="loading"
        heading={sgText(locale, "Loading verified Singapore evidence")}
        cause={sgText(locale, level === 'segment'
          ? 'Preparing the selected market region.'
          : 'Preparing the selected project and transactions.')}
        actionLabel={sgText(locale, "Return to Singapore Explore")}
        actionHref={marketHref(locale, "/sg/singapore/explore/")}
      />
      <div className={styles.routeLoadingGrid} aria-hidden="true">
        <i /><i /><i /><i />
      </div>
    </section>
  </SingaporePage>;
}
