'use client';

import dynamic from 'next/dynamic';
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react';
import type { LivingContext } from '../../lib/research/living-context';
import type { MarketLocale } from '../../lib/locale/market-localization';
import type { DecisionPersona } from '../../lib/research/property-decision';
import type { DecisionPriceContext } from '../../lib/research/property-decision-price';
import { hasPropertyReviewForEntity, reviewLocation, reviewLocationForEntity } from '../../lib/research/property-review-locations';
import styles from './property-decision-workspace.module.css';

const DecisionReport = dynamic(() => import('./property-decision-report').then(module => module.PropertyDecisionReport));
const compactQuery = '(max-width: 1100px)';
function subscribeCompact(onChange: () => void) {
  const media = window.matchMedia(compactQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const compactSnapshot = () => window.matchMedia(compactQuery).matches;
const serverSnapshot = () => false;
type WorkspaceProps = { entity?: string; profileId?: string; profile?: LivingContext; priceContext?: DecisionPriceContext; analysisScope?: 'property' | 'area'; locale: MarketLocale; children: ReactNode };

/** Server-rendered data stays mounted while the independently scrolling report changes. */
export function PropertyDecisionWorkspace(props: WorkspaceProps) {
  const available = props.profile?.review || (props.profileId ? reviewLocation(props.profileId) : props.entity && hasPropertyReviewForEntity(props.entity));
  if (!available) return props.children;
  return <DecisionSession key={`${props.profileId ?? props.entity ?? props.profile?.id}:${props.locale}`} {...props} />;
}

function DecisionSession({ entity, profileId, profile, priceContext, analysisScope = 'property', locale, children }: WorkspaceProps) {
  const compact = useSyncExternalStore(subscribeCompact, compactSnapshot, serverSnapshot);
  const [opened, setOpened] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [persona, setPersona] = useState<DecisionPersona>('family');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ profile?: LivingContext; status: 'ready' | 'failed' | 'empty' } | null>(profile ? { profile, status: 'ready' } : null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusOnOpen = useRef(false);
  const loaded = useRef(Boolean(profile?.review));
  const headingId = useId();
  const panelId = useId();
  const visible = opened ?? !compact;
  const modal = visible && (compact || expanded);
  const t = (ko: string, en: string, zh: string) => locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;
  const location = profileId ? reviewLocation(profileId) : entity ? reviewLocationForEntity(entity) : profile ? reviewLocation(profile.id) : undefined;
  const selected = result?.profile;
  const propertyName = selected?.review?.name[locale === 'ko' ? 'ko' : 'en'] ?? location?.name?.[locale === 'ko' ? 'ko' : 'en'];

  function openPanel() {
    focusOnOpen.current = true;
    setOpened(true);
  }
  function closePanel() {
    dialog.current?.close();
    setOpened(false);
    setExpanded(false);
    if (window.location.hash === '#property-review') {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
    }
    trigger.current?.focus({ preventScroll: true });
  }

  function keepDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    // Native modality makes the page inert, but Chromium can still move focus
    // to browser chrome at the boundary. Keep keyboard traversal in the report.
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )).filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0
      && getComputedStyle(element).visibility !== 'hidden');
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  useEffect(() => {
    const revealHash = () => {
      if (window.location.hash === '#property-review') setOpened(true);
    };
    revealHash();
    window.addEventListener('hashchange', revealHash);
    // Existing deep links remain useful without jumping past the transaction data.
    const revealLink = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href="#property-review"]') : null;
      if (!anchor || !root.current?.contains(anchor) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      focusOnOpen.current = true;
      setOpened(true);
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}#property-review`);
      if (heading.current) {
        heading.current.focus({ preventScroll: true });
        focusOnOpen.current = false;
      }
    };
    document.addEventListener('click', revealLink);
    return () => {
      window.removeEventListener('hashchange', revealHash);
      document.removeEventListener('click', revealLink);
    };
  }, []);

  useEffect(() => {
    if (!visible || loaded.current) return;
    const controller = new AbortController();
    const query = profileId ? `profile=${encodeURIComponent(profileId)}` : `entity=${encodeURIComponent(entity!)}`;
    fetch(`/api/living-context/?${query}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('unavailable');
        const data = await response.json();
        if (data.status !== 'ready' || !Array.isArray(data.profiles)) throw new Error('unavailable');
        const match = (data.profiles as LivingContext[]).find(candidate => candidate.review && (profileId ? candidate.id === profileId : candidate.linked_entity_ids.includes(entity!)));
        loaded.current = Boolean(match);
        setResult(match ? { profile: match, status: 'ready' } : { status: 'empty' });
      })
      .catch(() => { if (!controller.signal.aborted) setResult({ status: 'failed' }); });
    return () => controller.abort();
  }, [visible, profile, profileId, entity, attempt]);

  useEffect(() => {
    if (modal && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (visible && (modal || focusOnOpen.current)) {
      heading.current?.focus({ preventScroll: true });
      focusOnOpen.current = false;
    }
  }, [visible, modal]);

  const panel = <>
    <header className={styles.panelHeader}>
      <div><p className={styles.eyebrow}>{analysisScope === 'area' ? t('지역 분석', 'Area analysis', '区域分析') : t('단지 분석', 'Property analysis', '项目分析')}</p>
        <h2 id={headingId} ref={heading} tabIndex={-1}>{propertyName ?? t('단지 분석', 'Property analysis', '项目分析')}</h2></div>
      <div className={styles.panelActions}>
        {!compact && <button type="button" className={styles.iconButton} aria-label={expanded ? t('옆 패널로 축소', 'Return to side panel', '返回侧边面板') : t('전체 리포트로 확대', 'Expand report', '展开完整报告')} onClick={() => { focusOnOpen.current = true; setExpanded(!expanded); }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{expanded ? <path d="M4 10h6V4m10 10h-6v6M10 10 3 3m11 11 7 7" /> : <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />}</svg>
        </button>}
        <button type="button" className={styles.iconButton} aria-label={t('판단 패널 닫기', 'Close decision panel', '关闭判断面板')} onClick={closePanel}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>
    </header>
    <div className={styles.panelBody}>
      {!result ? <div role="status" className={styles.loading}><span className={styles.skeleton} /><span className={styles.skeleton} /><p>{t('단지 분석을 불러오고 있어요.', 'Loading the property analysis.', '正在加载项目分析。')}</p></div>
        : result.status === 'failed' ? <div role="status" className={styles.empty}><h3>{t('분석을 불러오지 못했어요', 'The analysis could not be loaded', '暂时无法加载分析')}</h3><p>{t('거래 데이터는 계속 볼 수 있어요.', 'The transaction data is still available.', '您仍可查看成交数据。')}</p><button type="button" className={styles.secondaryButton} onClick={() => { setResult(null); setAttempt(value => value + 1); }}>{t('다시 시도', 'Try again', '重试')}</button></div>
          : !selected?.review ? <div className={styles.empty}><p>{t('이 단지의 판단 리포트가 아직 준비되지 않았어요.', 'A decision report is not yet available for this property.', '该项目的购房报告尚未发布。')}</p></div>
            : <DecisionReport review={selected.review} priceContext={priceContext} analysisScope={analysisScope} locale={locale} persona={persona} onPersonaChange={setPersona} />}
    </div>
  </>;

  return <div ref={root} className={styles.workspace} data-decision-workspace="true">
    <div id="property-review" className={styles.toolbar}>
      <span>{t('실거래와 매수 판단', 'Transactions & buying decision', '成交与购房判断')}</span>
      <button type="button" ref={trigger} className={styles.openButton} aria-expanded={visible} aria-controls={panelId} aria-haspopup={compact ? 'dialog' : undefined} onClick={() => visible ? closePanel() : openPanel()}>
        {visible ? t('판단 패널 닫기', 'Close analysis', '关闭分析') : t('매수 판단 보기', 'View buying decision', '查看购房判断')}
      </button>
    </div>
    <div className={styles.grid} data-panel-open={visible && !modal}>
      <div className={styles.main} data-decision-main="true">{children}</div>
      {visible && !modal && <aside id={panelId} className={styles.panel} data-decision-panel="side" aria-labelledby={headingId} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); closePanel(); } }}>{panel}</aside>}
    </div>
    {modal && <dialog ref={dialog} id={panelId} className={styles.dialog} data-decision-panel="modal" aria-labelledby={headingId} onKeyDown={keepDialogFocus} onCancel={event => { event.preventDefault(); closePanel(); }} onClick={event => { if (event.target === event.currentTarget) closePanel(); }}>{panel}</dialog>}
  </div>;
}
