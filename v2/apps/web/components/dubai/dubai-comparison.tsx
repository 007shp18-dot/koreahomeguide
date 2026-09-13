'use client';
import { useEffect, useRef, useState } from 'react';
import { comparisonHash, comparisonRows, type DubaiComparison } from '../../lib/dubai/comparison';
import { comparisonCopy } from '../../lib/dubai/comparison-copy';
import type { DubaiExploreModel } from '../../lib/dubai/route-types';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import styles from './dubai-comparison.module.css';

type Props = {
  locale: MarketLocale;
  model: Extract<DubaiExploreModel, { status: 'ready' }>;
  preset: DubaiComparison;
  onClose: () => void;
  onSave: (preset: DubaiComparison) => boolean;
};
export default function DubaiComparisonDialog({ locale, model, preset, onClose, onSave }: Props) {
  const copy = comparisonCopy(locale);
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const rows = comparisonRows(model.areas, preset);
  const current = { ...preset, ...model.context.comparisonPeriod };
  const changed = preset.from !== current.from || preset.to !== current.to;
  const integer = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const money = (value: number | undefined) => value === undefined ? copy.missing : `AED\u00a0${integer.format(value)}`;
  const date = (value: string) => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
  useEffect(() => {
    const element = dialog.current;
    const focus = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (focus instanceof HTMLElement && focus.isConnected) focus.focus({ preventScroll: true });
    };
  }, []);
  const share = async () => {
    const url = `${window.location.origin}${marketHref(locale, '/ae/dubai/explore/')}${comparisonHash(current)}`;
    try { await navigator.clipboard.writeText(url); setMessage(copy.copied); setShareUrl(''); }
    catch { setMessage(''); setShareUrl(url); }
  };
  return <dialog ref={dialog} className={styles.dialog} data-dubai-comparison="true" data-area-count={rows.length} aria-labelledby="dubai-comparison-title" aria-describedby="dubai-comparison-conditions" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className={styles.header}><div><span className={styles.eyebrow}>DUBAI · {copy[preset.housing]} · {copy[preset.stage]}</span><h2 id="dubai-comparison-title">{copy.title}</h2></div><button type="button" onClick={onClose}>{copy.close}</button></header>
    <div className={styles.body}>
      <p id="dubai-comparison-conditions">{copy.conditions}</p>
      <p className={styles.period}>{copy.period} · {date(current.from)} – {date(current.to)}</p>
      {changed ? <p className={styles.notice}>{copy.updated}</p> : null}
      <div className={styles.tableScroll} role="region" aria-label={copy.title} tabIndex={0}>
        <table className={styles.table}>
          <caption>{copy.disclaimer}</caption>
          <thead><tr><th scope="col">{copy.title}</th>{rows.map(row => <th scope="col" key={row.slug}>{row.area?.name ?? copy.gone}</th>)}</tr></thead>
          <tbody>
            <tr className={styles.primary}><th scope="row">{copy.price}</th>{rows.map(row => <td key={row.slug}>{money(row.sale?.medianPriceAed)}</td>)}</tr>
            <tr><th scope="row">{copy.sqm}</th>{rows.map(row => <td key={row.slug}>{row.sale ? `${money(row.sale.medianPricePerSqmAed)}/m²` : copy.missing}</td>)}</tr>
            <tr><th scope="row">{copy.count}</th>{rows.map(row => <td key={row.slug}>{row.sale ? integer.format(row.sale.n) : copy.missing}</td>)}</tr>
            {preset.stage === 'ready' ? <>
              <tr><th scope="row">{copy.rent}</th>{rows.map(row => <td key={row.slug}>{row.rent ? `${money(row.rent.medianAnnualRentAed)}${copy.year}` : copy.missing}</td>)}</tr>
              <tr><th scope="row">{copy.rents}</th>{rows.map(row => <td key={row.slug}>{row.rent ? integer.format(row.rent.totalN) : copy.missing}</td>)}</tr>
            </> : null}
            <tr><th scope="row">{copy.details}</th>{rows.map(row => <td key={row.slug}>{row.area?.href ? <a href={marketHref(locale, `${row.area.href}?housing=${preset.housing}&stage=${preset.stage}`)}>{copy.details}<span className={styles.srOnly}> · {row.area.name}</span></a> : copy.missing}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <p className={styles.source}><a href={model.context.sourceUrl} target="_blank" rel="noreferrer">{copy.source}</a></p>
      <p className={styles.local}>{copy.local}</p>
      {shareUrl ? <label className={styles.shareLink}>{copy.copyHelp}<input readOnly value={shareUrl} onFocus={event => event.currentTarget.select()} /></label> : null}
      <p className={styles.status} role="status">{message}</p>
    </div>
    <footer className={styles.footer}><button type="button" onClick={() => setMessage(onSave(current) ? copy.success : copy.failure)}>{copy.save}</button><button className={styles.primaryButton} type="button" onClick={() => void share()}>{copy.share}</button></footer>
  </dialog>;
}
