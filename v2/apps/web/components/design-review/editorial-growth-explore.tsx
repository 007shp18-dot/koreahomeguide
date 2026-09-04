'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { EditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model';
import styles from './editorial-growth-review.module.css';

const COPY = Object.freeze({
  en: {
    eyebrow: 'Seoul evidence map',
    title: 'Explore Seoul by reported evidence.',
    search: 'Search a building or district',
    transaction: 'Transaction',
    housing: 'Home type',
    budget: 'Price / deposit',
    district: 'District',
    more: 'More filters',
    sort: 'Sort by',
    results: 'results',
    list: 'List',
    map: 'Map',
    selected: 'Selected building',
    check: 'Check this price',
    unavailable: 'Official evidence is temporarily unavailable.',
    insufficient: 'Not enough compatible reported contracts for a distribution.',
    allRentals: 'All rentals',
    apartment: 'Apartment',
    any: 'Any',
    allSeoul: 'All Seoul',
    evidence: 'Evidence',
    limited: 'Evidence limited',
    unavailableTitle: 'Evidence unavailable',
    published: 'Published evidence',
    withheld: 'Below publication minimum',
    mapTitle: 'Seoul districts by publication state',
  },
  'zh-CN': {
    eyebrow: '首尔成交依据地图',
    title: '按已申报数据探索首尔。',
    search: '搜索建筑或行政区',
    transaction: '交易类型',
    housing: '住宅类型',
    budget: '价格 / 保证金',
    district: '行政区',
    more: '更多筛选',
    sort: '排序',
    results: '条结果',
    list: '列表',
    map: '地图',
    selected: '已选择建筑',
    check: '查询这个价格',
    unavailable: '官方成交依据暂时无法使用。',
    insufficient: '可比的已申报合同不足，无法显示分布。',
    allRentals: '全部租赁',
    apartment: '公寓',
    any: '不限',
    allSeoul: '首尔全市',
    evidence: '数据依据',
    limited: '数据有限',
    unavailableTitle: '数据不可用',
    published: '已发布数据',
    withheld: '低于发布门槛',
    mapTitle: '首尔各区数据发布状态',
  },
});

type ExploreReviewModel = Pick<EditorialGrowthReviewModel,
  'locale' | 'state' | 'ad' | 'seoulStatus' | 'exploreRows' | 'exploreDistricts'>;

export function EditorialGrowthExplore({ model }: Readonly<{ model: ExploreReviewModel }>) {
  const copy = COPY[model.locale];
  const [mobileMode, setMobileMode] = useState<'list' | 'map'>('list');
  const [selectedId, setSelectedId] = useState(() => (
    model.exploreRows.find((row) => row.selected)?.id ?? model.exploreRows[0]?.id
  ));
  const selected = model.exploreRows.find((row) => row.id === selectedId) ?? model.exploreRows[0];
  const query = `locale=${model.locale}&state=${model.state}&ad=${model.ad}`;

  return (
    <main
      className={styles.explorePage}
      data-explore-layout="rail-map"
      data-explore-rail="420"
      data-mobile-mode={mobileMode}
    >
      <div className={styles.mobileExploreSwitch} aria-label="Explore view">
        <button aria-pressed={mobileMode === 'list'} onClick={() => setMobileMode('list')} type="button">
          {copy.list}
        </button>
        <button aria-pressed={mobileMode === 'map'} onClick={() => setMobileMode('map')} type="button">
          {copy.map}
        </button>
      </div>

      <aside className={styles.exploreRail}>
        <header className={styles.exploreIntro}>
          <p className={styles.eyebrow}>{copy.eyebrow} · {model.seoulStatus}</p>
          <h1 className={styles.sectionTitle}>{copy.title}</h1>
        </header>

        <div className={styles.exploreSearch}>
          <label htmlFor="review-explore-search">{copy.search}</label>
          <input id="review-explore-search" placeholder={copy.search} type="search" />
        </div>

        <div className={styles.exploreFilters} aria-label="Explore filters">
          {[
            [copy.transaction, copy.allRentals],
            [copy.housing, copy.apartment],
            [copy.budget, copy.any],
            [copy.district, copy.allSeoul],
          ].map(([label, value], index) => (
            <label data-default-filter={index + 1} key={label}>
              <span>{label}</span>
              <select defaultValue={value}><option value={value}>{value}</option></select>
            </label>
          ))}
          <button className={styles.moreFilters} type="button">{copy.more}<span aria-hidden="true"> +</span></button>
        </div>

        {model.state === 'ready' ? (
          <>
            <div className={styles.resultBar}>
              <strong>{model.exploreRows.length} {copy.results}</strong>
              <label>{copy.sort}<select defaultValue="evidence"><option value="evidence">{copy.evidence}</option></select></label>
            </div>
            <ol className={styles.exploreResults}>
              {model.exploreRows.slice(0, 6).map((row) => (
                <li data-selected-building={row.id === selectedId ? 'true' : undefined} key={row.id}>
                  <button onClick={() => setSelectedId(row.id)} type="button">
                    <span>{row.district}</span>
                    <strong>{row.name}</strong>
                    <b>{row.primaryValue}</b>
                    <small>{row.sample} · {row.period}</small>
                  </button>
                </li>
              ))}
            </ol>
            {selected ? (
              <section className={styles.selectedBuilding}>
                <p className={styles.eyebrow}>{copy.selected}</p>
                <h2 className={styles.subheading}>{selected.name}</h2>
                <p>{selected.district} · {selected.sample}</p>
                <Link className={styles.primaryAction} href={`/design-review/editorial-growth/check/?${query}`}>
                  {copy.check}
                </Link>
              </section>
            ) : null}
          </>
        ) : (
          <section className={styles.exploreState} data-result-state={model.state}>
            <h2 className={styles.subheading}>{model.state === 'insufficient' ? copy.limited : copy.unavailableTitle}</h2>
            <p>{model.state === 'insufficient' ? copy.insufficient : copy.unavailable}</p>
          </section>
        )}
      </aside>

      <section className={styles.mapPane} aria-label="Seoul district evidence map">
        {model.state === 'ready' && model.exploreDistricts.length > 0 ? (
          <svg role="img" aria-labelledby="review-map-title" viewBox="0 0 720 560">
            <title id="review-map-title">{copy.mapTitle}</title>
            {model.exploreDistricts.map((district) => (
              <path
                aria-current={district.selected ? 'true' : undefined}
                aria-label={`${district.name}: ${district.evidenceState}`}
                className={district.selected ? styles.mapDistrictSelected : styles.mapDistrict}
                d={district.path}
                key={district.id}
                role="img"
              />
            ))}
          </svg>
        ) : (
          <div className={styles.mapUnavailable} data-result-state={model.state}>
            <p>{model.state === 'insufficient' ? copy.insufficient : copy.unavailable}</p>
          </div>
        )}
        <div className={styles.mapKey}>
          <span><i className={styles.mapKeyPublished} /> {copy.published}</span>
          <span><i className={styles.mapKeyWithheld} /> {copy.withheld}</span>
        </div>
      </section>
    </main>
  );
}
