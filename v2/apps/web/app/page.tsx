import { IntentTabs } from '../components/intent-tabs';
import { MarketCard } from '../components/market-card';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';
import { TrustStrip } from '../components/trust-strip';
import {
  homepageCopy,
  homepageIntentGroups,
  homepageMarketCards,
} from '../lib/site-copy';

export default function Home() {
  return (
    <div id="top">
      <SiteHeader copy={homepageCopy.header} />
      <main>
        <section className="hero site-shell" aria-labelledby="home-headline">
          <div className="hero__copy">
            <div className="hero__statement">
              <p className="section-eyebrow">{homepageCopy.hero.eyebrow}</p>
              <h1 id="home-headline">{homepageCopy.hero.headline}</h1>
            </div>
            <p className="hero__description">{homepageCopy.hero.description}</p>
          </div>
          <div className="hero__intents">
            <div className="hero__intents-heading">
              <h2>{homepageCopy.hero.intentHeading}</h2>
              <p>{homepageCopy.hero.intentDescription}</p>
            </div>
            <IntentTabs
              label={homepageCopy.hero.intentNavigationLabel}
              groups={homepageIntentGroups}
            />
          </div>
        </section>

        <section
          className="markets site-shell"
          id="markets"
          aria-label={homepageCopy.markets.sectionLabel}
        >
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">{homepageCopy.markets.eyebrow}</p>
              <h2>{homepageCopy.markets.heading}</h2>
            </div>
            <p>{homepageCopy.markets.description}</p>
          </div>
          <div className="market-grid">
            {homepageMarketCards.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </section>

        <section
          className="principles site-shell"
          id="principles"
          aria-label={homepageCopy.principles.sectionLabel}
        >
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">{homepageCopy.principles.eyebrow}</p>
              <h2>{homepageCopy.principles.heading}</h2>
            </div>
          </div>
          <div className="principles__grid">
            {homepageCopy.principles.items.map((item) => (
              <article className="principle" key={item.title}>
                <span className="principle__index" aria-hidden="true">
                  {item.index}
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="site-shell trust-strip-wrap">
          <TrustStrip copy={homepageCopy.trust} />
        </div>
      </main>
      <SiteFooter copy={homepageCopy.footer} />
    </div>
  );
}
