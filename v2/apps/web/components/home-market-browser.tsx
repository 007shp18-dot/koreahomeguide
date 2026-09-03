import Link from 'next/link';

import type { HomeFeaturedBuilding } from '../lib/public-market/home-featured-buildings.server';
import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import type { HomepageMarketModel } from '../lib/site-copy';
import { RotatingHeroBuilding } from './home-building-showcase';
import styles from './home-editorial.module.css';

type HomeMarketBrowserProps = Readonly<{
  copy: {
    hero: { headline: string; description: string };
    markets: { sectionLabel: string };
  };
  markets: readonly HomepageMarketModel[];
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
          <h1 id="home-headline">{copy.hero.headline}</h1>
          <p className={styles.deck}>{copy.hero.description}</p>
          <form className={styles.searchForm} action="/kr/seoul/explore/" method="get" role="search">
            <label htmlFor="home-building-search">Search city, district or building</label>
            <div>
              <input id="home-building-search" name="q" type="search" autoComplete="off" placeholder="Search city, area or building" />
              <button type="submit" aria-label="Search signed prices">⌕</button>
            </div>
          </form>
          <nav className={styles.marketShortcuts} aria-label="Quick market links">
            <Link href="/kr/seoul/">Korea <span>→</span></Link>
            <Link href="/sg/">Singapore <span>→</span></Link>
            <Link href="/ae/dubai/">Dubai <span>→</span></Link>
          </nav>
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
