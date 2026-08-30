import { HomeMarketBrowser } from '../components/home-market-browser';
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
        <HomeMarketBrowser
          copy={homepageCopy}
          groups={homepageIntentGroups}
          markets={homepageMarketCards}
        />

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
