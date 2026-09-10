import type { HdbCandidateReviewItem } from '../../lib/data-operations/hdb-buildings.server';

import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import Link from 'next/link';

import type { HdbBlockDisplay } from '../../lib/singapore/hdb-route-model.server';
import type { PublicEntityProximity } from '../../lib/public-data/entity-location-projection.server';
import { ProjectedEntityMedia, type ProjectedEntityMediaModel } from '../public-market/projected-entity-media';
import { SingaporePage, singaporeStyles as styles } from './singapore-shell';
import { MarketDetailShell } from '../market-ui/market-shell';
import { MarketSummary } from '../market-ui/market-summary';
import detailStyles from '../market-ui/detail-layout.module.css';
import { SingaporeNearbyPlaces } from './singapore-nearby-places';

export function HdbBlockDetail({ locale = 'en',
  block,
  town,
  townHref,
  googleMapsBrowserKey,
  proximity = null,
  media = null,
  approvedFacts = null,
}: Readonly<{ locale?: MarketLocale;
  block: HdbBlockDisplay;
  town: string;
  townHref: string;
  googleMapsBrowserKey: string | null;
  proximity?: PublicEntityProximity | null;
  media?: ProjectedEntityMediaModel | null;
  approvedFacts?: HdbCandidateReviewItem | null;
}>) {
  const facts=approvedFacts?.status==='approved' && approvedFacts.entityId===`sg-singapore:block:${block.blockId}`?approvedFacts:null;
  const property=facts?{yearCompleted:String(facts.yearCompleted??'—'),maxFloorLevel:String(facts.maxFloorLevel??'—'),totalDwellingUnits:String(facts.dwellingUnits??'—')}:block.property;
  return <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")} unframed>
    <MarketDetailShell locale={locale}
      breadcrumb={<nav className={styles.breadcrumbs} aria-label={sgText(locale, "Breadcrumb")}><Link href={marketHref(locale, "/sg/singapore/explore/")}>{sgText(locale, "Explore")}</Link><Link href={marketHref(locale, townHref)}>{town}</Link><span>{block.address}</span></nav>}
      sections={[
        { id: 'detail-overview', label: locale === 'ko' ? '개요' : 'Overview' },
        { id: 'detail-evidence', label: locale === 'ko' ? '가격' : 'Prices' },
        { id: 'hdb-block-profile', label: locale === 'ko' ? '건물·주변 정보' : 'Property & location' },
        { id: 'detail-source', label: locale === 'ko' ? '출처' : 'Sources' },
      ]}
      summary={<div data-hdb-block="ready"><MarketSummary locale={locale} kind="building" title={block.address} location={town}
        context={sgText(locale, 'Singapore · HDB block')}
        metric={{label:sgText(locale, 'Resale median'),value:sgText(locale, block.resaleMedianLabel ?? 'Not published'),note:`${block.resaleCountLabel} ${sgText(locale, 'records')} · ${block.resalePeriod ?? '—'}`}}
        facts={[]} /></div>}
      media={<ProjectedEntityMedia locale={locale}
        media={media}
        fallbackMarket="singapore"
        browserKey={googleMapsBrowserKey}
        buildingName={block.address}
        buildingKey={`singapore:block:${block.blockId}`}
        address={`${block.address}, ${town}, Singapore`}
        registryKey={`sg-hdb:${town}:${block.address}`}
        evidenceHref="#hdb-block-evidence-heading"
      />}
      evidence={<><section className={styles.section} aria-labelledby="hdb-block-evidence-heading">
      <h2 id="hdb-block-evidence-heading">{sgText(locale, "Reported HDB evidence.")}</h2>
      <dl className={styles.stats}>
        <div className={styles.stat}><dt>{sgText(locale, "Monthly rent median")}</dt><dd>{sgText(locale, block.rentalMedianLabel ?? 'Not published')}</dd><small>{sgText(locale, block.rentalCountLabel)}{sgText(locale, " records")} · {block.rentalPeriod ?? (locale === 'ko' ? '집계 기간 미제공' : 'Reporting period unavailable')}</small></div>
      </dl>
    </section>
      <section id="hdb-block-profile" className={detailStyles.section} aria-labelledby="hdb-block-facts-heading">
      <h2 id="hdb-block-facts-heading">{sgText(locale, "HDB property information.")}</h2>
      {property === null ? <p>{sgText(locale, "Matched property facts are unavailable for this observed block.")}</p> : <dl className={styles.stats}>
        <div className={styles.stat}><dt>{sgText(locale, "Year completed")}</dt><dd>{sgText(locale, property.yearCompleted)}</dd></div>
        <div className={styles.stat}><dt>{sgText(locale, "Maximum floor")}</dt><dd>{sgText(locale, property.maxFloorLevel)}</dd></div>
        <div className={styles.stat}><dt>{sgText(locale, "Dwelling units")}</dt><dd>{sgText(locale, property.totalDwellingUnits)}</dd></div>
      </dl>}
      {facts && <p><small><a href="https://data.gov.sg/datasets/d_17f5382f26140b1fdae0ba2ef6239d2f/view" target="_blank" rel="noreferrer">HDB · data.gov.sg</a> · {locale==='ko'?'자료 확인':'Source checked'} {facts.fetchedAt.slice(0,10)}</small></p>}
      <SingaporeNearbyPlaces locale={locale} proximity={proximity} />
    </section></>}
      rail={<details className={detailStyles.disclosure}><summary>{locale === 'ko' ? '출처·집계 기준' : 'Sources and publication criteria'}</summary>
        <p>{locale === 'ko' ? 'HDB 공식 재판매·임대차·건물 자료. 거래 유형별 5건 이상인 경우에만 중앙값을 공개합니다.' : 'HDB official resale, rental and property records. Medians require at least five records per transaction type.'}</p>
        <Link href={marketHref(locale, townHref)}>{locale === 'ko' ? '지역 자료와 출처 확인' : 'View town evidence and sources'}</Link>
      </details>}
    />
  </SingaporePage>;
}
