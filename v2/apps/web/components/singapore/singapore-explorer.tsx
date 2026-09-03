'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { SingaporeExploreModel } from '../../lib/singapore/route-types';
import type { HdbExploreModel } from '../../lib/singapore/hdb-route-model.server';
import { GooglePlaceMap, type GoogleMarketMapPoint } from '../maps/google-place-map';
import { HdbMarketPanel } from './hdb-market-panel';
import { MarketExploreShell, MarketLayerControl } from '../market-ui/market-shell';
import {
  SingaporeEvidence,
  SingaporePage,
  SingaporeScope,
  singaporeStyles as styles,
} from './singapore-shell';

function SingaporeMapSection({
  browserKey,
  points = Object.freeze([]),
  heading = 'Singapore sale prices by area',
}: Readonly<{
  browserKey: string | null;
  points?: readonly GoogleMarketMapPoint[];
  heading?: string;
}>) {
  return (
    <section className={styles.exploreMap} aria-labelledby="singapore-map-heading">
      <div className={styles.panelHeading}>
        <p className={styles.sectionLabel}>Location</p>
        <h2 id="singapore-map-heading">{heading}</h2>
      </div>
      <GooglePlaceMap browserKey={browserKey} points={points} />
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
  const [selectedSegment, setSelectedSegment] = useState<'CCR' | 'RCR' | 'OCR'>('CCR');
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
  const segmentCenters = {
    CCR: { latitude: 1.2897, longitude: 103.8501 },
    RCR: { latitude: 1.3270, longitude: 103.8460 },
    OCR: { latitude: 1.3691, longitude: 103.8061 },
  } as const;
  const selected = model.segments.find((segment) => segment.code === selectedSegment) ?? model.segments[0];
  const segmentPoints = model.segments.map((segment) => ({
    id: segment.code,
    title: `${segment.code} · ${segment.n} transactions`,
    label: `${segment.code} · ${segment.medianPriceLabel ?? 'Not published'}`,
    ...segmentCenters[segment.code],
  } satisfies GoogleMarketMapPoint));
  const projectPoints = (selected?.projects ?? []).map((project) => ({
    id: project.id,
    title: `${project.name} · ${project.street}`,
    label: project.medianPriceLabel ?? `${project.n} sales`,
    address: `${project.name}, ${project.street}, Singapore`,
  } satisfies GoogleMarketMapPoint));
  const selectedSegmentPoint = segmentPoints.filter((point) => point.id === selected?.code);
  const mapPoints = projectPoints.length > 0
    ? [...selectedSegmentPoint, ...projectPoints]
    : segmentPoints;
  return (
    <SingaporePage currentHref="/sg/singapore/explore/" unframed>
      <div data-singapore-explore-workspace="true" data-singapore-evidence="ready">
        <MarketExploreShell
          eyebrow="Singapore Explore"
          title="Residential transaction evidence"
          period={<>{model.transactionLabel}<br />{model.periodLabel}</>}
          layers={marketLayers}
          discovery={<section className={styles.segmentPanel} id="ura-private" aria-labelledby="segment-heading">
            <div className={styles.panelHeading}>
              <div><p className={styles.sectionLabel}>URA private sales</p><h2 id="segment-heading">Market segments</h2></div>
              <SingaporeScope />
            </div>
            <div className={styles.segmentTabs} role="tablist" aria-label="Singapore market regions">
              {model.segments.map((segment) => <button
                key={segment.code}
                type="button"
                role="tab"
                aria-selected={selected?.code === segment.code}
                onClick={() => setSelectedSegment(segment.code)}
              >
                <strong>{segment.code}</strong>
                <span>{segment.medianPriceLabel ?? 'Not published'}</span>
              </button>)}
            </div>
            <div className={styles.segmentList}>
              {model.segments.map((segment) => (
                <article className={styles.segmentRow} key={segment.code} hidden={selected?.code !== segment.code}>
                  <div><p className={styles.rowState}>{segment.state === 'published' ? 'Published evidence' : 'Below publication minimum'}</p><h3>{segment.code}</h3></div>
                  <div><strong>{segment.medianPriceLabel ?? 'Not published'}</strong><span>{segment.medianPsfLabel ?? 'PSF not published'}</span></div>
                  <div><span>{segment.n} transactions</span><span>{segment.projectCount} projects</span></div>
                  <Link href={segment.href}>Open {segment.code} evidence</Link>
                </article>
              ))}
            </div>
            <div className={styles.projectList} aria-live="polite">
              <header><span>Projects in {selected?.code}</span><small>Top projects by reported sales</small></header>
              {(selected?.projects ?? []).map((project) => <Link href={project.href} key={project.id}>
                <span><strong>{project.name}</strong><small>{project.street} · District {project.district}</small></span>
                <span><strong>{project.medianPriceLabel ?? 'Not published'}</strong><small>{project.n} sales</small></span>
              </Link>)}
            </div>
          </section>}
          spatial={<SingaporeMapSection
            browserKey={googleMapsBrowserKey}
            points={mapPoints}
            heading={`${selected?.code ?? 'Singapore'} project prices on the map`}
          />}
        />
      </div>
      <HdbMarketPanel model={hdbModel} />
      <SingaporeEvidence model={model.evidence} compact />
    </SingaporePage>
  );
}
