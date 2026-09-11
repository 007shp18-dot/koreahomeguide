import { localizedMarketCopy } from '../../lib/locale/market-localization';
import Link from 'next/link';
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import type { SingaporeEntryModel } from '../../lib/singapore/route-types';
import { MarketOverview } from '../market-ui/market-overview';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '../market-representative-photo';
import { SingaporePage } from './singapore-shell';

export function SingaporeEntry({ locale = 'en', model, googleMapsBrowserKey = null }: Readonly<{ locale?: MarketLocale; model: SingaporeEntryModel; googleMapsBrowserKey?: string | null }>) {
  void googleMapsBrowserKey;
  const ko = locale === 'ko';
  const ready = model.status === 'ready';
  // These counts are supplied by the existing route model; never replace absent values with zero.
  const transactionCount = ready ? model.transactionLabel.match(/[\d,]+/)?.[0] : undefined;
  const projectCount = ready ? model.projectLabel.match(/[\d,]+/)?.[0] : undefined;
  const facts = ready ? [
    ...(transactionCount ? [{ label: localizedMarketCopy(locale, "Transactions", "거래 건수"), value: Number(transactionCount.replaceAll(',', '')).toLocaleString('en-SG'), detail: localizedMarketCopy(locale, "Private residential sales", "민간 주택 매매") }] : []),
    ...(projectCount ? [{ label: localizedMarketCopy(locale, "Projects", "단지 수"), value: Number(projectCount.replaceAll(',', '')).toLocaleString('en-SG'), detail: localizedMarketCopy(locale, "URA transaction coverage", "URA 자료 기준") }] : []),
    { label: localizedMarketCopy(locale, "Currency", "거래 통화"), value: model.currency },
  ] : [];
  return <SingaporePage locale={locale} currentHref={marketHref(locale, '/sg/')} unframed>
    <div data-singapore-entry={model.status}>
      <MarketOverview locale={locale} city={localizedMarketCopy(locale, "Singapore", "싱가포르")}
        description={localizedMarketCopy(locale, "Explore private-home and HDB transactions separately, then compare an asking price.", "민간 주택과 공공주택(HDB)의 거래를 구분해 살펴보고 매물 가격을 비교하세요.")}
        media={<MarketRepresentativePhoto photo={{ ...MARKET_PHOTOS.singapore, alt: locale === 'zh-CN' ? '新加坡高层住宅建筑' : ko ? '싱가포르 도시 전경' : MARKET_PHOTOS.singapore.alt }} eager locale={locale} />}
        facts={facts} available={ready} period={ready ? `${localizedMarketCopy(locale, "Reporting period", "집계 기간")}: ${model.periodLabel}` : undefined}
        actions={[
          { label: localizedMarketCopy(locale, "Explore reported prices", "실거래가 탐색"), href: marketHref(locale, ready ? model.exploreHref : '/sg/singapore/explore/'), description: localizedMarketCopy(locale, "Explore neighbourhoods and developments.", "동네와 단지별 거래를 확인하세요.") },
          { label: localizedMarketCopy(locale, "Compare an asking price", "매물 가격 비교"), href: marketHref(locale, '/sg/singapore/check/'), description: localizedMarketCopy(locale, "Compare your asking price with similar transactions.", "비슷한 조건의 거래와 매물 가격을 비교하세요.") },
          { label: localizedMarketCopy(locale, "Buying guide", "구입 전 확인사항"), href: marketHref(locale, '/guides/singapore-condo-buying-budget-guide/'), description: localizedMarketCopy(locale, "Plan purchase costs and checks before committing.", "구입 비용과 계약 전에 확인할 서류를 살펴보세요.") },
        ]}
        notes={<>
          <p>{localizedMarketCopy(locale, "Private residential sale statistics use URA data. CCR, RCR and OCR remain separate; HDB resale and rental evidence is shown separately.", "민간 주택 매매 통계는 URA 자료를 기준으로 집계합니다. CCR·RCR·OCR을 구분하며, HDB 재판매와 임대 자료는 별도로 확인하세요.")}</p>
          {ready ? <><ul>{model.evidence.limitations.map(limitation => <li key={limitation}>{sgText(locale, limitation)}</li>)}</ul>
            <p>{ko ? `거래 ${model.evidence.publicationMinimum}건 미만의 가격 통계는 표시하지 않습니다.` : locale === 'zh-CN' ? `少于 ${model.evidence.publicationMinimum} 笔交易的样本不公布价格统计。` : `Price statistics are withheld for samples below ${model.evidence.publicationMinimum} transactions.`}</p></> : null}
          <p>{localizedMarketCopy(locale, "Current listings and personalized investment recommendations are not provided.", "현재 매물이나 맞춤 투자 추천은 제공하지 않습니다.")}</p>
          <p><a href="https://www.ura.gov.sg/Corporate/Property/Property-Data">{localizedMarketCopy(locale, "URA property data", "싱가포르 도시재개발청(URA) 주택 거래 자료")}</a> · <Link href={marketHref(locale, '/trust/')}>{localizedMarketCopy(locale, "Source and methodology", "데이터 기준 (영문)")}</Link> · <Link href={marketHref(locale, model.correctionHref)}>{localizedMarketCopy(locale, "Corrections", "자료 정정 내역")}</Link></p>
        </>} />
    </div>
  </SingaporePage>;
}
