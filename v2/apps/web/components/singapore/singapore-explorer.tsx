'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

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
  onSelectPoint,
  selection,
}: Readonly<{
  browserKey: string | null;
  points?: readonly GoogleMarketMapPoint[];
  heading?: string;
  onSelectPoint?: (id: string) => void;
  selection?: ReactNode;
}>) {
  return (
    <section className={styles.exploreMap} aria-labelledby="singapore-map-heading">
      <div className={styles.panelHeading}>
        <p className={styles.sectionLabel}>Location</p>
        <h2 id="singapore-map-heading">{heading}</h2>
      </div>
      <GooglePlaceMap browserKey={browserKey} points={points} onSelectPoint={onSelectPoint} />
      {selection}
    </section>
  );
}

const marketLayers = <MarketLayerControl label="Singapore market layers" items={[
  { id: 'ura', label: 'URA private sales', href: '#ura-private', current: true },
  { id: 'resale', label: 'HDB resale', href: '#hdb-resale' },
  { id: 'rent', label: 'HDB rent', href: '#hdb-rent' },
]} />;

const segmentCenters = {
  CCR: { latitude: 1.2897, longitude: 103.8501 },
  RCR: { latitude: 1.3270, longitude: 103.8460 },
  OCR: { latitude: 1.3691, longitude: 103.8061 },
} as const;

export function SingaporeExplorer({
  model,
  hdbModel = { status: 'unavailable' },
  googleMapsBrowserKey = null,
}: Readonly<{
  model: SingaporeExploreModel;
  hdbModel?: HdbExploreModel;
  googleMapsBrowserKey?: string | null;
}>) {
  const [selectedSegment, setSelectedSegment] = useState<'CCR' | 'RCR' | 'OCR' | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const segments = model.status === 'ready' ? model.segments : Object.freeze([]);
  const selected = useMemo(
    () => segments.find((segment) => segment.code === selectedSegment),
    [segments, selectedSegment],
  );
  const segmentPoints = useMemo(() => segments.map((segment) => ({
    id: `segment-${segment.code}`,
    title: `${segment.code} · ${segment.n} transactions`,
    label: `${segment.code} · ${segment.medianPriceLabel ?? 'Not published'}`,
    ...segmentCenters[segment.code],
    selected: selected?.code === segment.code,
  } satisfies GoogleMarketMapPoint)), [segments, selected?.code]);
  const projectPoints = useMemo(() => (selected?.projects ?? []).map((project) => ({
    id: `project-${project.id}`,
    title: `${project.name} · ${project.street}`,
    label: project.medianPriceLabel ?? `${project.n} sales`,
    address: `${project.name}, ${project.street}, Singapore`,
    selected: selectedProjectId === project.id,
  } satisfies GoogleMarketMapPoint)), [selected?.projects, selectedProjectId]);
  const mapPoints = selected === undefined ? segmentPoints : projectPoints;
  const selectedProject = selected?.projects?.find((project) => project.id === selectedProjectId);
  const selectSegment = useCallback((segment: 'CCR' | 'RCR' | 'OCR') => {
    setSelectedSegment(segment);
    setSelectedProjectId(null);
  }, []);
  const onMapSelect = useCallback((id: string) => {
    if (id.startsWith('segment-')) {
      const segment = id.slice('segment-'.length);
      if (segment === 'CCR' || segment === 'RCR' || segment === 'OCR') selectSegment(segment);
      return;
    }
    if (id.startsWith('project-')) setSelectedProjectId(id.slice('project-'.length));
  }, [selectSegment]);
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
                onClick={() => selectSegment(segment.code)}
              >
                <strong>{segment.code}</strong>
                <span>{segment.medianPriceLabel ?? 'Not published'}</span>
              </button>)}
            </div>
            <div className={styles.segmentList}>
              {model.segments.map((segment) => (
                <article className={styles.segmentRow} key={segment.code} hidden={selected === undefined || selected.code !== segment.code}>
                  <div><p className={styles.rowState}>{segment.state === 'published' ? 'Published evidence' : 'Below publication minimum'}</p><h3>{segment.code}</h3></div>
                  <div><strong>{segment.medianPriceLabel ?? 'Not published'}</strong><span>{segment.medianPsfLabel ?? 'PSF not published'}</span></div>
                  <div><span>{segment.n} transactions</span><span>{segment.projectCount} projects</span></div>
                  {segment.state === 'published' ? <Link
                    href={segment.href}
                    aria-busy={pendingHref === segment.href}
                    data-navigation-state={pendingHref === segment.href ? 'pending' : 'idle'}
                    onClick={() => setPendingHref(segment.href)}
                  >Open {segment.code} evidence</Link> : <span
                    className={styles.evidenceUnavailableLink}
                    data-evidence-link="unavailable"
                    aria-disabled="true"
                  >At least 5 transactions are required</span>}
                </article>
              ))}
            </div>
            {selected === undefined ? <div className={styles.segmentPrompt}><strong>Select CCR, RCR or OCR</strong><p>The map starts at the regional tier. Choose a region to reveal verified project bubbles.</p></div> : <div className={styles.projectList} aria-live="polite">
              <header><span>Projects in {selected.code}</span><small>Reported private sales</small></header>
              {(selected.projects ?? []).map((project) => <div data-selected={selectedProjectId === project.id} key={project.id}>
                <button type="button" onClick={() => setSelectedProjectId(project.id)}><span><strong>{project.name}</strong><small>{project.street} · District {project.district}</small></span><span><strong>{project.medianPriceLabel ?? 'Not published'}</strong><small>{project.n} sales</small></span></button>
                {project.state === 'published' ? <Link
                  href={project.href}
                  aria-label={`Open ${project.name} evidence`}
                  aria-busy={pendingHref === project.href}
                  data-navigation-state={pendingHref === project.href ? 'pending' : 'idle'}
                  onClick={() => setPendingHref(project.href)}
                >→</Link> : <span
                  className={styles.evidenceUnavailableLink}
                  data-evidence-link="unavailable"
                  aria-disabled="true"
                  title="At least 5 transactions are required"
                >—</span>}
              </div>)}
            </div>}
          </section>}
          spatial={<SingaporeMapSection
            browserKey={googleMapsBrowserKey}
            points={mapPoints}
            heading={selected === undefined ? 'CCR, RCR and OCR sale prices' : `${selected.code} project prices on the map`}
            onSelectPoint={onMapSelect}
            selection={selectedProject === undefined ? undefined : <aside className={styles.mapSelection} aria-live="polite"><span>Selected project</span><h3>{selectedProject.name}</h3><p>{selectedProject.street} · District {selectedProject.district}</p><strong>{selectedProject.medianPriceLabel ?? 'Not published'}</strong><small>{selectedProject.n} reported sales</small>{selectedProject.state === 'published' ? <Link
              href={selectedProject.href}
              aria-busy={pendingHref === selectedProject.href}
              data-navigation-state={pendingHref === selectedProject.href ? 'pending' : 'idle'}
              onClick={() => setPendingHref(selectedProject.href)}
            >Open project evidence →</Link> : <span className={styles.evidenceUnavailableLink} data-evidence-link="unavailable" aria-disabled="true">At least 5 transactions are required</span>}</aside>}
          />}
        />
      </div>
      <HdbMarketPanel model={hdbModel} />
      <SingaporeEvidence model={model.evidence} compact />
    </SingaporePage>
  );
}
