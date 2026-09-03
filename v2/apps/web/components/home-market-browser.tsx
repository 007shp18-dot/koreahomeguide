import type { HomeFeaturedBuilding } from '../lib/public-market/home-featured-buildings.server';
import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import { RotatingHeroBuilding } from './home-building-showcase';
import styles from './home-editorial.module.css';

type HomeMarketBrowserProps = Readonly<{
  copy: {
    hero: { headline: string; description: string };
    markets: { sectionLabel: string };
  };
  seoul: SeoulLiveModel;
  featuredBuildings: readonly HomeFeaturedBuilding[];
  naverMapClientId: string | null;
}>;

export function HomeMarketBrowser({
  copy,
  seoul,
  featuredBuildings,
  naverMapClientId,
}: HomeMarketBrowserProps) {
  return (
    <section className={styles.hero} id="home-decision" aria-labelledby="home-headline">
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>Global property intelligence</span>
          <h1 id="home-headline">{copy.hero.headline}</h1>
          <p className={styles.deck}>{copy.hero.description}</p>
          <form className={styles.searchForm} action="/kr/seoul/explore/" method="get" role="search">
            <label htmlFor="home-building-search">Search city, district or building</label>
            <div>
              <input id="home-building-search" name="q" type="search" autoComplete="off" placeholder="Search city, area or building" />
              <button type="submit" aria-label="Search signed prices">⌕</button>
            </div>
          </form>
          <p className={styles.searchHint}>Search Seoul buildings now. Singapore and Dubai follow their local evidence boundaries.</p>
        </div>

        <div className={styles.heroMedia} data-home-market="seoul" data-seoul-live={seoul.status}>
          {featuredBuildings.length === 0 ? (
            <div className={styles.mediaFallback}>
              <span>SEOUL</span><span>SINGAPORE</span><span>DUBAI</span>
              <strong>Verified market coverage</strong>
            </div>
          ) : (
            <RotatingHeroBuilding buildings={featuredBuildings} naverMapClientId={naverMapClientId} />
          )}
        </div>
      </div>
    </section>
  );
}
