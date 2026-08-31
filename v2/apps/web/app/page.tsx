import { HomeMarketBrowser } from '../components/home-market-browser';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';
import { TrustStrip } from '../components/trust-strip';
import {
  buildHomepagePresentation,
  homepageCopy,
} from '../lib/site-copy';
import type { Metadata } from 'next';
import { buildSingaporeEntryModel } from '../lib/singapore/route-model.server';
import { singaporeSnapshotRepositoryFromEnvironment } from '../lib/singapore/snapshot-repository.server';

export const metadata: Metadata = homepageCopy.metadata;

export default async function Home() {
  const singaporeRepository = await singaporeSnapshotRepositoryFromEnvironment();
  const presentation = buildHomepagePresentation(buildSingaporeEntryModel(singaporeRepository));
  const copy = presentation.copy;
  return (
    <div id="top">
      <SiteHeader copy={copy.header} />
      <main>
        <HomeMarketBrowser
          copy={copy}
          groups={presentation.groups}
          markets={presentation.markets}
        />

        <section
          className="principles site-shell"
          id="principles"
          aria-label={copy.principles.sectionLabel}
        >
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">{copy.principles.eyebrow}</p>
              <h2>{copy.principles.heading}</h2>
            </div>
          </div>
          <div className="principles__grid">
            {copy.principles.items.map((item) => (
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
          <TrustStrip copy={copy.trust} />
        </div>
      </main>
      <SiteFooter copy={copy.footer} />
    </div>
  );
}
