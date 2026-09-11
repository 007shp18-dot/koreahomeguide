'use client';
import { localizedMarketCopy } from '../../lib/locale/market-localization';


import type { Ref } from 'react';

import { createDubaiCheckHref } from '../../lib/dubai/check-model';
import type { DubaiExploreResult } from '../../lib/dubai/explore-model';
import type { DubaiProjectEvidence } from '../../lib/dubai/project-evidence';
import { marketHref, marketText, type MarketLocale } from '../../lib/locale/market-localization';
import { PassportLink as Link } from '../passport/passport-journey';
import styles from './dubai-research.module.css';

const integer = new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 });
const money = (value: number) => `AED\u00a0${integer.format(value)}`;

/** Published cohorts are summaries of registered sales, never available homes. */
export function DubaiExploreSelection({
  locale, selected, stage, period, asOfDate, projects, selectedProject, returnTo,
  onSelectProject, onClose, panelRef,
}: Readonly<{
  locale: MarketLocale;
  selected: DubaiExploreResult;
  stage: 'ready' | 'off-plan';
  period: string;
  asOfDate: string;
  projects: readonly DubaiProjectEvidence[];
  selectedProject: DubaiProjectEvidence | undefined;
  returnTo: string;
  onSelectProject: (id: string | null) => void;
  onClose: () => void;
  panelRef: Ref<HTMLElement>;
}>) {
  const t = (value: string) => marketText(locale, value);
  const { area, segment, sale } = selected;
  return <section id="dubai-selected-area" className={styles.selectedArea} ref={panelRef}
    aria-labelledby="dubai-selected-area-title" data-dubai-area-selection={area.slug}>
    <header className={styles.selectionHeader}>
      <div><p>{localizedMarketCopy(locale, "Selected area", "선택한 지역")}</p>
        <h2 id="dubai-selected-area-title">{t(area.name)}</h2>
        <p>{t(segment.housing === 'apartment' ? 'Apartment' : 'Villa')} · {t(stage === 'ready' ? 'Ready' : 'Off-Plan')}</p>
      </div>
      <button type="button" onClick={onClose} aria-label={t('Close area preview')}>{t('Close')}</button>
    </header>
    <dl className={styles.selectionMetrics}>
      <div><dt>{t('Median sale price')}</dt><dd>{money(sale.medianPriceAed)}</dd></div>
      <div><dt>{t('Median AED/m²')}</dt><dd>{money(sale.medianPricePerSqmAed)}/m²</dd></div>
      <div><dt>{t('Registered sales')}</dt><dd>{integer.format(sale.n)}</dd></div>
      <div><dt>{t('Median annual rent')}</dt><dd>{t(`${money(segment.rent.medianAnnualRentAed)}/year`)}</dd></div>
    </dl>
    <p className={styles.selectionNote}>{locale === 'ko'
      ? `DLD 지역별 집계 · ${period} · 자료 기준 ${asOfDate}`
      : locale === 'zh-CN' ? `DLD 区域汇总 · ${period} · 数据截至 ${asOfDate}` : `DLD area aggregates · ${period} · As of ${asOfDate}`}</p>
    <nav className={styles.selectionActions} aria-label={localizedMarketCopy(locale, "Selected area actions", "선택한 지역 살펴보기")}>
      <Link href={marketHref(locale, createDubaiCheckHref({
        area: area.slug, housing: segment.housing, completion: stage,
        askingPriceAed: null, areaSqm: null, annualRentAed: null, returnTo,
      }))}>{t('Compare an asking price')}</Link>
      {area.href ? <Link href={marketHref(locale, `${area.href}?housing=${segment.housing}&stage=${stage}`)}>
        {localizedMarketCopy(locale, "Full area analysis", "지역 분석 전체 보기")}
      </Link> : null}
    </nav>
    <section className={styles.selectionProjects} aria-labelledby="dubai-selected-projects">
      <h3 id="dubai-selected-projects">{localizedMarketCopy(locale, "Project sales summaries", "프로젝트별 거래 요약")} <span>{projects.length}</span></h3>
      {projects.length > 0 ? <>
        <p>{localizedMarketCopy(locale, "Same home type and sale stage. Projects with at least 30 registered sales; partial coverage.", "같은 주택 유형·완공 상태에서 30건 이상 거래된 프로젝트입니다. 일부 프로젝트만 포함합니다.")}</p>
        <div className={styles.selectionProjectList}>
          {projects.map(project => <button key={project.id} type="button"
            aria-pressed={selectedProject?.id === project.id} aria-controls="dubai-project-summary"
            onClick={() => onSelectProject(selectedProject?.id === project.id ? null : project.id)}>
            <span><strong>{t(project.name)}</strong><small>{integer.format(project.n)} {t('registered sales')}</small></span>
            <span><strong>{money(project.medianPriceAed)}</strong><small>{money(project.medianPricePerSqmAed)}/m²</small></span>
          </button>)}
        </div>
        {selectedProject ? <div id="dubai-project-summary" className={styles.selectedProject} data-dubai-project-selection={selectedProject.id}>
          <h4>{t(selectedProject.name)}</h4>
          <p>{t('DLD project ')}{selectedProject.projectNumber} · {period}</p>
          <p>{money(selectedProject.medianPriceAed)} · {integer.format(selectedProject.n)} {t('registered sales')}</p>
          <p>{t('Area location only')}. {localizedMarketCopy(locale, "The map remains on the area; a precise project location is not verified.", "지도는 프로젝트의 정확한 건물 위치를 표시하지 않습니다.")}</p>
        </div> : null}
      </> : <p>{localizedMarketCopy(locale, "Project-level summaries are not published for this selection yet. Area figures remain available above.", "이 조건의 프로젝트별 집계는 아직 없습니다. 위 지역 통계로 비교할 수 있습니다.")}</p>}
    </section>
  </section>;
}
