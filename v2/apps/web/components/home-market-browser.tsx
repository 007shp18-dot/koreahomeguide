import Link from 'next/link';

import type { HomeMarketVisual } from '../lib/home-market-visuals.server';
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
  featuredBuildings: readonly HomeMarketVisual[];
  naverMapClientId: string | null;
  googleMapsBrowserKey: string | null;
}>;

export function HomeMarketBrowser({
  copy,
  seoul,
  featuredBuildings,
  naverMapClientId,
  googleMapsBrowserKey,
}: HomeMarketBrowserProps) {
  return (
    <section className={styles.hero} id="home-decision" aria-labelledby="home-headline">
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <h1 id="home-headline">{copy.hero.headline}</h1>
          <p className={styles.deck}>{copy.hero.description}</p>
          <form className={styles.searchForm} action="/prices/" method="get" role="search">
            <label htmlFor="home-building-search">Search city, district or building</label>
            <div>
              <select name="market" aria-label="Market">
                <option value="seoul">Seoul</option>
                <option value="singapore">Singapore</option>
                <option value="dubai">Dubai</option>
              </select>
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

        <div className={styles.heroMedia} data-home-market="global" data-seoul-live={seoul.status}>
          {featuredBuildings.length === 0 ? (
            <div className={styles.mediaFallback}>
              <span>SEOUL</span><span>SINGAPORE</span><span>DUBAI</span>
              <strong>Verified market coverage</strong>
            </div>
          ) : (
            <RotatingHeroBuilding buildings={featuredBuildings} naverMapClientId={naverMapClientId} googleMapsBrowserKey={googleMapsBrowserKey} />
          )}
        </div>
      </div>
    </section>
  );
}
