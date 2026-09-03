import Link from 'next/link';

import type { SingaporeExploreModel } from '../../lib/singapore/route-types';
import type { HdbExploreModel } from '../../lib/singapore/hdb-route-model.server';
import { GooglePlaceMap } from '../maps/google-place-map';
import { HdbMarketPanel } from './hdb-market-panel';
import { MarketExploreShell, MarketLayerControl } from '../market-ui/market-shell';
import {
  SingaporeEvidence,
  SingaporePage,
  SingaporeScope,
  singaporeStyles as styles,
} from './singapore-shell';

function SingaporeMapSection({ browserKey }: Readonly<{ browserKey: string | null }>) {
  return (
    <section className={styles.exploreMap} aria-labelledby="singapore-map-heading">
      <div className={styles.panelHeading}>
        <p className={styles.sectionLabel}>Location</p>
        <h2 id="singapore-map-heading">Search a Singapore address</h2>
      </div>
      <GooglePlaceMap browserKey={browserKey} />
    </section>
  );
}

const marketLayers = <MarketLayerControl label="Singapore market layers" items={[
  { id: 'ura', label: 'URA private sales', href: '#ura-private', current: true },
  { id: 'resale', label: 'HDB resale', href: '#hdb-resale' },
  { id: 'rent', label: 'HDB rent', href: '#hdb-rent' },
]} />;

export function SingaporeExplorer({
  model,
  hdbModel = { status: 'unavailable' },
  googleMapsBrowserKey = null,
}: Readonly<{
  model: SingaporeExploreModel;
  hdbModel?: HdbExploreModel;
  googleMapsBrowserKey?: string | null;
}>) {
  if (model.status === 'unavailable') return (
    <SingaporePage currentHref="/sg/singapore/explore/" unframed>
      <div data-singapore-explore-workspace="true" data-singapore-evidence="unavailable">
        <MarketExploreShell
          eyebrow="Singapore Explore"
          title="Residential transaction evidence"
          period="Evidence unavailable"
          layers={marketLayers}
          discovery={<>
            <div className={styles.emptyState}>
              <h2>{model.message}</h2>
              <p>No market figure is substituted while verified evidence is unavailable.</p>
              <div className={styles.actions}><Link href="/trust/">Review Global Trust</Link><Link href={model.correctionHref}>Review corrections</Link></div>
            </div>
            <HdbMarketPanel model={hdbModel} />
          </>}
          spatial={<SingaporeMapSection browserKey={googleMapsBrowserKey} />}
        />
      </div>
    </SingaporePage>
  );
  return (
    <SingaporePage currentHref="/sg/singapore/explore/" unframed>
      <div data-singapore-explore-workspace="true" data-singapore-evidence="ready">
        <MarketExploreShell
          eyebrow="Singapore Explore"
          title="Residential transaction evidence"
          period={<>{model.transactionLabel}<br />{model.periodLabel}</>}
          layers={marketLayers}
          discovery={<section id="ura-private" aria-labelledby="segment-heading">
            <div className={styles.panelHeading}>
              <div><p className={styles.sectionLabel}>URA private sales</p><h2 id="segment-heading">Market segments</h2></div>
              <SingaporeScope />
            </div>
            <div className={styles.segmentList}>
              {model.segments.map((segment) => (
                <article className={styles.segmentRow} key={segment.code}>
                  <div><p className={styles.rowState}>{segment.state === 'published' ? 'Published evidence' : 'Below publication minimum'}</p><h3>{segment.code}</h3></div>
                  <div><strong>{segment.medianPriceLabel ?? 'Not published'}</strong><span>{segment.medianPsfLabel ?? 'PSF not published'}</span></div>
                  <div><span>{segment.n} transactions</span><span>{segment.projectCount} projects</span></div>
                  <Link href={segment.href}>Open {segment.code} evidence</Link>
                </article>
              ))}
            </div>
          </section>}
          spatial={<SingaporeMapSection browserKey={googleMapsBrowserKey} />}
        />
      </div>
      <HdbMarketPanel model={hdbModel} />
      <SingaporeEvidence model={model.evidence} />
    </SingaporePage>
  );
}
