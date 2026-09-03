import Link from 'next/link';

import type { HomeFeaturedBuilding } from '../lib/public-market/home-featured-buildings.server';
import type { SeoulLiveModel } from '../lib/public-market/seoul-live-model.server';
import type { HomepageMarketModel } from '../lib/site-copy';
import { NaverBuildingStreetView } from './maps/naver-building-street-view';
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
  const featured = featuredBuildings[0];
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
          {featured === undefined ? (
            <div className={styles.mediaFallback}>
              <span>SEOUL</span><span>SINGAPORE</span><span>DUBAI</span>
              <strong>Verified market coverage</strong>
            </div>
          ) : (
            <>
              <NaverBuildingStreetView
                clientId={naverMapClientId}
                buildingName={featured.name}
                latitude={featured.latitude}
                longitude={featured.longitude}
                addressQuery={featured.addressQuery}
                mapHref={featured.href}
              />
              <div className={styles.heroMediaCaption}>
                <span>Featured building evidence · Seoul</span>
                <h2>{featured.name}</h2>
                <p>{featured.location} · {featured.observationLabel}</p>
                <Link href={featured.href}>View building →</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
