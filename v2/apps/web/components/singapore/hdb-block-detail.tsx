import { localizedMarketCopy } from '../../lib/locale/market-localization';
import type { HdbCandidateReviewItem } from '../../lib/data-operations/hdb-buildings.server';

import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import Link from 'next/link';

import type { HdbBlockDisplay } from '../../lib/singapore/hdb-route-model.server';
import type { PublicEntityProximity } from '../../lib/public-data/entity-location-projection.server';
import type { PublicEntityLocation } from '../../lib/public-data/public-evidence-types';
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
  location = null,
  proximity = null,
  media = null,
  approvedFacts = null,
}: Readonly<{ locale?: MarketLocale;
  block: HdbBlockDisplay;
  town: string;
  townHref: string;
  googleMapsBrowserKey: string | null;
  location?: PublicEntityLocation | null;
  proximity?: PublicEntityProximity | null;
  media?: ProjectedEntityMediaModel | null;
  approvedFacts?: HdbCandidateReviewItem | null;
}>) {
  const entityId = `sg-singapore:block:${block.blockId}`;
  const facts=approvedFacts?.status==='approved' && approvedFacts.entityId===`sg-singapore:block:${block.blockId}`?approvedFacts:null;
  const property=facts?{yearCompleted:String(facts.yearCompleted??'—'),maxFloorLevel:String(facts.maxFloorLevel??'—'),totalDwellingUnits:String(facts.dwellingUnits??'—')}:block.property;
  const verifiedLocation = location?.entityId === entityId
    && location.marketId === 'sg-singapore'
    && location.verificationStatus === 'verified'
      ? location
      : null;
  const isOneMapLocation = verifiedLocation?.provider.trim().toLocaleLowerCase('en-SG') === 'onemap';
  const coordinateLabel = verifiedLocation === null
    ? null
    : `${verifiedLocation.latitude.toFixed(6)}, ${verifiedLocation.longitude.toFixed(6)}`;
  const locationHref = verifiedLocation === null
    ? undefined
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${verifiedLocation.latitude},${verifiedLocation.longitude}`)}`;
  return <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")} unframed>
    <MarketDetailShell locale={locale}
      breadcrumb={<nav className={styles.breadcrumbs} aria-label={sgText(locale, "Breadcrumb")}><Link href={marketHref(locale, "/sg/singapore/explore/")}>{sgText(locale, "Explore")}</Link><Link href={marketHref(locale, townHref)}>{town}</Link><span>{block.address}</span></nav>}
      sections={[
        { id: 'detail-overview', label: localizedMarketCopy(locale, "Overview", "개요") },
        { id: 'detail-evidence', label: localizedMarketCopy(locale, "Prices", "가격") },
        { id: 'hdb-block-profile', label: localizedMarketCopy(locale, "Property & location", "건물·주변 정보") },
        { id: 'detail-source', label: localizedMarketCopy(locale, "Sources", "출처") },
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
        evidenceHref="#hdb-block-evidence-heading"
        locationHref={locationHref}
      />}
      evidence={<><section className={styles.section} aria-labelledby="hdb-block-evidence-heading">
      <h2 id="hdb-block-evidence-heading">{sgText(locale, "Reported HDB evidence.")}</h2>
      <dl className={styles.stats}>
        <div className={styles.stat}><dt>{sgText(locale, "Monthly rent median")}</dt><dd>{sgText(locale, block.rentalMedianLabel ?? 'Not published')}</dd><small>{sgText(locale, block.rentalCountLabel)}{sgText(locale, " records")} · {block.rentalPeriod ?? (localizedMarketCopy(locale, "Reporting period unavailable", "집계 기간 미제공"))}</small></div>
      </dl>
    </section>
      <section id="hdb-block-profile" className={detailStyles.section} aria-labelledby="hdb-block-facts-heading">
      <h2 id="hdb-block-facts-heading">{sgText(locale, "HDB property information.")}</h2>
      {property === null ? <p>{sgText(locale, "Matched property facts are unavailable for this observed block.")}</p> : <dl className={styles.stats}>
        <div className={styles.stat}><dt>{sgText(locale, "Year completed")}</dt><dd>{sgText(locale, property.yearCompleted)}</dd></div>
        <div className={styles.stat}><dt>{sgText(locale, "Maximum floor")}</dt><dd>{sgText(locale, property.maxFloorLevel)}</dd></div>
        <div className={styles.stat}><dt>{sgText(locale, "Dwelling units")}</dt><dd>{sgText(locale, property.totalDwellingUnits)}</dd></div>
      </dl>}
      {coordinateLabel === null ? null : <dl className={styles.stats} data-hdb-location="verified">
        <div className={styles.stat}><dt>{localizedMarketCopy(locale, "Verified coordinates", "확인된 좌표")}</dt><dd>{coordinateLabel}</dd></div>
      </dl>}
      {facts && <p><small><a href="https://data.gov.sg/datasets/d_17f5382f26140b1fdae0ba2ef6239d2f/view" target="_blank" rel="noreferrer">HDB · data.gov.sg</a> · {locale==='ko'?'자료 확인':'Source checked'} {facts.fetchedAt.slice(0,10)}</small></p>}
      <SingaporeNearbyPlaces locale={locale} proximity={proximity} />
    </section></>}
      rail={<>{isOneMapLocation ? <section className={detailStyles.locationAttribution} data-location-attribution="onemap" aria-label={localizedMarketCopy(locale, "OneMap coordinate attribution", "OneMap 좌표 출처")}>
        <strong>{localizedMarketCopy(locale, "Coordinate source", "좌표 출처")}</strong>
        <p>{localizedMarketCopy(locale, "Contains information from ", "이 좌표에는 ")}<a href="https://www.onemap.gov.sg/" target="_blank" rel="noreferrer">OneMap</a>{localizedMarketCopy(locale, ", made available under the ", " 정보가 포함되어 있으며 ")}<a href="https://www.onemap.gov.sg/legal/opendatalicence.html" target="_blank" rel="noreferrer">Singapore Open Data Licence v1.0</a>{locale === 'ko' ? `에 따라 제공됩니다. 자료 확인 ${verifiedLocation?.verifiedAt.slice(0, 10)}.` : locale === 'zh-CN' ? ` 提供。来源查阅日期 ${verifiedLocation?.verifiedAt.slice(0, 10)}。` : `. Source accessed ${verifiedLocation?.verifiedAt.slice(0, 10)}.`}</p>
      </section> : null}
      <details className={detailStyles.disclosure}><summary>{localizedMarketCopy(locale, "Sources and publication criteria", "출처·집계 기준")}</summary>
        <p>{localizedMarketCopy(locale, "HDB official resale, rental and property records. Medians require at least five records per transaction type.", "HDB 공식 재판매·임대차·건물 자료. 거래 유형별 5건 이상인 경우에만 중앙값을 공개합니다.")}</p>
        <Link href={marketHref(locale, townHref)}>{localizedMarketCopy(locale, "View town evidence and sources", "지역 자료와 출처 확인")}</Link>
      </details></>}
    />
  </SingaporePage>;
}
