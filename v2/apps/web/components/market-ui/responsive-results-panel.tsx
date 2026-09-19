'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
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
  return mobile ? <MobileResultsPanel labels={labels}>{children}</MobileResultsPanel> : children;
}

function MobileResultsPanel({ children, labels }: { children: ReactNode; labels: ResultsPanelLabels }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  const anchorId = labels.anchorId;
  useEffect(() => {
    if (!anchorId) return;
    const revealAnchor = () => {
      if (window.location.hash !== `#${anchorId}` || !dialog.current) return;
      if (!dialog.current.open) { dialog.current.showModal(); setOpen(true); }
      document.getElementById(anchorId)?.scrollIntoView({ block: 'start' });
    };
    revealAnchor();
    window.addEventListener('hashchange', revealAnchor);
    return () => window.removeEventListener('hashchange', revealAnchor);
  }, [anchorId]);
  return <>
    <button className={styles.openPanel} ref={trigger} type="button" aria-haspopup="dialog" aria-controls={panelId} aria-expanded={open}
      onClick={() => { dialog.current?.showModal(); setOpen(true); }}>{labels.open}</button>
    <dialog className={styles.panel} ref={dialog} id={panelId} aria-labelledby={headingId} data-explore-results-panel="true"
      onClose={() => {
        setOpen(false);
        if (anchorId && window.location.hash === `#${anchorId}`) {
          window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
        }
        trigger.current?.focus({ preventScroll: true });
      }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close();
      }}>
      <header className={styles.panelHeader}>
        <h2 id={headingId}>{labels.title}</h2>
        <button type="button" aria-label={labels.close} onClick={() => dialog.current?.close()}>×</button>
      </header>
      <div className={styles.panelBody}>{children}</div>
    </dialog>
  </>;
}
