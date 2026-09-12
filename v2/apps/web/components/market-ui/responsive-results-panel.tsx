'use client';

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react';
import styles from './explore-controls.module.css';

const mobileQuery = '(max-width: 760px)';
function subscribe(onChange: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const getSnapshot = () => window.matchMedia(mobileQuery).matches;
const getServerSnapshot = () => false;

export type ResultsPanelLabels = Readonly<{ title: string; open: string; close: string; anchorId?: string }>;

/** A single results tree: inline on desktop, a native modal sheet on mobile. */
export function ResponsiveResultsPanel({ children, labels }: { children: ReactNode; labels: ResultsPanelLabels }) {
  const mobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const anchorId = labels.anchorId;
  useEffect(() => {
    if (!mobile || !anchorId) return;
    const revealAnchor = () => {
      if (window.location.hash !== `#${anchorId}` || !dialog.current) return;
      if (!dialog.current.open) dialog.current.showModal();
      document.getElementById(anchorId)?.scrollIntoView({ block: 'start' });
    };
    revealAnchor();
    window.addEventListener('hashchange', revealAnchor);
    return () => window.removeEventListener('hashchange', revealAnchor);
  }, [mobile, anchorId, children]);
  if (!mobile) return children;
  return <>
    <button className={styles.openPanel} type="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>{labels.open}</button>
    <dialog className={styles.panel} ref={dialog} aria-labelledby={headingId} data-explore-results-panel="true"
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <header className={styles.panelHeader}>
        <h2 id={headingId}>{labels.title}</h2>
        <button type="button" aria-label={labels.close} onClick={() => dialog.current?.close()}>×</button>
      </header>
      <div className={styles.panelBody}>{children}</div>
    </dialog>
  </>;
}
