import { PropertyLivingContext } from '../market-ui/living-context';
import { localizedMarketCopy } from '../../lib/locale/market-localization';

import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import { singaporeProjectDisplayName } from '../../lib/singapore/project-display-name';
import { createPropertyScenarioHref } from '../../lib/tools/property-scenario-context';
import { buildProjectMonthlyResearch, summarizeSizeCohorts } from '../../lib/research/property-research';
import { MonthlyTransactionResearch, SizeCohortResearch } from '../market-ui/transaction-research';
import { DetailTools } from '../market-ui/detail-tools';
import detailStyles from '../market-ui/detail-layout.module.css';
import { PassportLink as Link } from '../passport/passport-journey';

import type {
  SingaporeProjectModel,
  SingaporeUnavailableModel,
} from '../../lib/singapore/route-types';
import type { PublicEntityProximity } from '../../lib/public-data/entity-location-projection.server';
import { ProjectedEntityMedia, type ProjectedEntityMediaModel } from '../public-market/projected-entity-media';
import {
  SingaporeEvidence,
  SingaporePage,
  singaporeStyles as styles,
} from './singapore-shell';
import { MarketDetailShell } from '../market-ui/market-shell';
import { MarketSummary } from '../market-ui/market-summary';
import { SingaporeNearbyPlaces } from './singapore-nearby-places';
import { SingaporeTransactionsTable } from './singapore-transactions-table';
import { RecordPlaceVisit } from '../discovery/recent-places';
import { DiscoveryReading } from '../discovery/discovery-reading';

function PriceRange({ locale = 'en', value }: Readonly<{ locale?: MarketLocale; value: string }>) {
  const separator = value.indexOf('–');
  if (separator < 0) return value;
  return <>{sgText(locale, value.slice(0, separator + 1))}<wbr />{sgText(locale, value.slice(separator + 1))}</>;
}

export function SingaporeProjectDetail({ locale = 'en', model, googleMapsBrowserKey = null, proximity = null, media = null }: Readonly<{ locale?: MarketLocale;
  model: SingaporeProjectModel | SingaporeUnavailableModel;
  googleMapsBrowserKey?: string | null;
  proximity?: PublicEntityProximity | null;
  media?: ProjectedEntityMediaModel | null;
}>) {
  if (model.status === 'unavailable') return (
    <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")}>
      <section className={styles.unavailable} data-singapore-project="unavailable" data-product-intro="true">
        <h1>{sgText(locale, model.message)}</h1><p>{sgText(locale, "No project value is substituted.")}</p>
      </section>
    </SingaporePage>
  );
  const displayName = singaporeProjectDisplayName(model.identity);
  if (model.status === 'insufficient') return (
    <SingaporePage locale={locale} currentHref={marketHref(locale, '/sg/singapore/explore/')} unframed>
      <MarketDetailShell locale={locale}
        breadcrumb={<Link href={marketHref(locale, '/sg/singapore/explore/')}>{sgText(locale, 'Explore')}</Link>}
        sections={[
          { id: 'detail-overview', label: localizedMarketCopy(locale, "Overview", "개요") },
          { id: 'detail-evidence', label: localizedMarketCopy(locale, "Evidence status", "자료 현황") },
          { id: 'detail-source', label: localizedMarketCopy(locale, "Sources", "출처") },
        ]}
        summary={<div data-singapore-project="insufficient"><MarketSummary locale={locale} kind="project" title={displayName}
          location={model.identity.street} context={`Singapore · ${model.identity.marketSegment}`}
          metric={{label:localizedMarketCopy(locale, "Median sale price", "매매가격 중앙값"),value:sgText(locale, 'Not published')}}
          facts={[{label:sgText(locale, 'Sample'),value:String(model.count)}]} /></div>}
        media={<ProjectedEntityMedia locale={locale} media={media} fallbackMarket="singapore"
          browserKey={googleMapsBrowserKey} buildingName={model.identity.project} displayBuildingName={displayName}
          buildingKey={`singapore:project:${model.identity.id}`} address={`${model.identity.street}, Singapore`}
          locationHref={marketHref(locale, `/sg/singapore/explore/?region=${model.identity.marketSegment.toLowerCase()}&q=${encodeURIComponent(displayName)}&project=${encodeURIComponent(model.identity.id)}`)} />}
        evidence={<section className={detailStyles.section}><h2>{localizedMarketCopy(locale, "Not enough transactions to publish a price", "가격 게시에 필요한 거래가 부족합니다")}</h2>
          <p>{locale === 'ko' ? `신고 거래 ${model.count}건입니다. 중앙값은 ${model.threshold}건 이상일 때 공개합니다.` : locale === 'zh-CN' ? `${model.count} 笔申报交易，至少 ${model.threshold} 笔才公布中位数。` : `${model.count} reported transactions. A median requires at least ${model.threshold}.`}</p>
          <SingaporeNearbyPlaces locale={locale} proximity={proximity} />
          <PropertyLivingContext entity={`sg-singapore:project:${model.identity.id}`} locale={locale} />
        </section>}
        rail={<SingaporeEvidence locale={locale} model={model.evidence} />} />
    </SingaporePage>
  );
  const records = model.transactions.map(({ source, propertyTypeLabel, saleTypeLabel, areaBasisLabel, tenureLabel }) => ({
    month: source.contractMonth.slice(0, 7), price: source.priceSgd, area: source.areaSqm,
    group: `${propertyTypeLabel} · ${saleTypeLabel} · ${areaBasisLabel} · ${tenureLabel}`,
  }));
  const [from, to] = model.evidence.period.split('..');
  const months = buildProjectMonthlyResearch(records, from ?? '', to ?? '');
  const sizes = summarizeSizeCohorts(records);
  return (
    <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/singapore/explore/")} unframed>
      <RecordPlaceVisit place={{ market: 'singapore', key: model.identity.id, name: displayName, href: `/sg/singapore/explore/${model.identity.marketSegment.toLowerCase()}/${encodeURIComponent(model.identity.id)}/` }} />
      <MarketDetailShell locale={locale}
        related={<DiscoveryReading market="singapore" locale={locale} />}
        sections={[
          { id: 'detail-overview', label: localizedMarketCopy(locale, "Overview", "개요") },
          { id: 'detail-evidence', label: localizedMarketCopy(locale, "Prices & transactions", "가격·실거래") },
          { id: 'project-profile', label: localizedMarketCopy(locale, "Property & location", "건물·주변 정보") },
          { id: 'detail-tools', label: localizedMarketCopy(locale, "Compare", "내 조건 비교") },
          { id: 'detail-source', label: localizedMarketCopy(locale, "Sources", "출처") },
        ]}
        breadcrumb={<nav className={styles.breadcrumbs} aria-label={sgText(locale, "Breadcrumb")}>
        <Link href={marketHref(locale, "/sg/singapore/explore/")}>{sgText(locale, "Explore")}</Link>
        <Link href={marketHref(locale, `/sg/singapore/explore/${model.identity.marketSegment.toLowerCase()}/`)}>
          {sgText(locale, model.identity.marketSegment)}
        </Link>
        <span>{displayName}</span></nav>}
        summary={<div data-singapore-project="ready"><MarketSummary locale={locale} kind="project"
          title={displayName}
          location={model.identity.street}
          context={`${sgText(locale, 'Singapore')} · ${model.identity.marketSegment} · ${sgText(locale, 'District')} ${model.identity.district}`}
          metric={{
            label: localizedMarketCopy(locale, "Median sale price for this period", "집계 기간 매매가격 중앙값"),
            value: sgText(locale, model.display.medianPriceLabel),
            secondary: sgText(locale, model.display.medianPsfLabel),
            note: `${sgText(locale, 'Reporting period')} · ${model.evidence.period}`,
          }}
          facts={[
            { label: sgText(locale, 'Sample'), value: sgText(locale, model.display.sampleLabel) },
            ...(model.identity.tenures.filter(Boolean).length ? [{ label: sgText(locale, 'Tenure in reported records'), value: sgText(locale, model.identity.tenures.filter(Boolean).join(' · ')) }] : []),
          ]}
          actions={<Link href={marketHref(locale, model.checkHref)}>{sgText(locale, 'Compare an asking price')}</Link>}
        /></div>}
        media={<ProjectedEntityMedia locale={locale}
          media={media}
          fallbackMarket="singapore"
          locationHref={marketHref(locale, `/sg/singapore/explore/?region=${model.identity.marketSegment.toLowerCase()}&q=${encodeURIComponent(displayName)}&project=${encodeURIComponent(model.identity.id)}`)}
          browserKey={googleMapsBrowserKey}
          buildingName={model.identity.project}
          buildingKey={`singapore:project:${model.identity.id}`}
          address={`${model.identity.street}, Singapore`}
          displayBuildingName={displayName}
          evidenceHref="#project-summary-heading"
        />}
        evidence={<><section className={styles.section} aria-labelledby="project-summary-heading">
        <h2 id="project-summary-heading">{localizedMarketCopy(locale, "Price distribution", "가격 분포")}</h2>
        <dl className={styles.stats}>
          <div className={styles.stat}><dt>{sgText(locale, "Middle half")}</dt><dd><PriceRange locale={locale} value={model.display.middlePriceLabel} /></dd></div>
        </dl>
      </section>
      <MonthlyTransactionResearch locale={locale} months={months} />
      <section className={styles.section} aria-labelledby="transaction-heading">
        <h2 id="transaction-heading">{localizedMarketCopy(locale, "Reported transactions", "신고 실거래")}</h2>
        <SingaporeTransactionsTable key={model.identity.id} locale={locale} rows={model.transactions.map(({ source, ...row }) => { void source; return row; })} />
      </section>
      <section className={styles.section} aria-labelledby="project-size-heading"><h2 id="project-size-heading">{sgText(locale, "Compare prices by home size")}</h2><p>{sgText(locale, "Same project and reporting period. Property type, sale type, area basis and tenure stay separate. A cohort needs at least five transactions to publish its median.")}</p><SizeCohortResearch locale={locale} rows={sizes} currency="SGD" /></section>
      <section id="project-profile" className={detailStyles.section} aria-labelledby="project-profile-heading">
        <h2 id="project-profile-heading">{localizedMarketCopy(locale, "Property and location", "건물·주변 정보")}</h2>
        <dl className={detailStyles.facts}>
          <div><dt>{sgText(locale, 'Property types')}</dt><dd>{sgText(locale, [...new Set(model.transactions.map(row => row.propertyTypeLabel))].join(' · '))}</dd></div>
          <div><dt>{localizedMarketCopy(locale, "Sale types in these records", "거래 유형")}</dt><dd>{sgText(locale, [...new Set(model.transactions.map(row => row.saleTypeLabel))].join(' · '))}</dd></div>
        </dl>
        <Link href={marketHref(locale, `/sg/singapore/explore/?region=${model.identity.marketSegment.toLowerCase()}&q=${encodeURIComponent(displayName)}&project=${encodeURIComponent(model.identity.id)}`)}>{sgText(locale, 'View this project on the map')}</Link>
        <SingaporeNearbyPlaces locale={locale} proximity={proximity} />
          <PropertyLivingContext entity={`sg-singapore:project:${model.identity.id}`} locale={locale} />
      </section>
      <DetailTools locale={locale} checkHref={marketHref(locale, model.checkHref)}
        calculatorHref={createPropertyScenarioHref({locale,market:'sg-singapore',currency:'SGD',entity:model.identity.id,propertyName:displayName,transaction:'sale',price:model.identity.medianPriceSgd,returnTo:marketHref(locale, `/sg/singapore/explore/${model.identity.marketSegment.toLowerCase()}/${model.identity.id}/`)})} />
</>}
        rail={<SingaporeEvidence locale={locale} model={model.evidence} />}
      />
    </SingaporePage>
  );
}
