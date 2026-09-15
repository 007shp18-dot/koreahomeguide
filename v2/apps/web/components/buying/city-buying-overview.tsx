import Link from 'next/link';
import type { ContentLocale } from '../../lib/content/content-types';
import type { BuyingCity } from '../../lib/home/buying-journey';
import { CITY_BUYING, cityText, cityPrefix, comparisonSlug, consultationHref } from '../../content/city-buying-content';
import { BUDGET_GUIDE_SERIES } from '../../content/budget-guide-series';
import styles from './buying.module.css';
export function CityBuyingOverview({city,locale}:{city:BuyingCity;locale:ContentLocale}) {
 const model=CITY_BUYING[city], t=(a:readonly string[])=>cityText(a,locale), prefix=cityPrefix(locale);
 const guide=BUDGET_GUIDE_SERIES.find(g=>g.city===city)!;
 const guidePrefix=locale==='zh-CN'&&city!=='tokyo'?'':prefix;
 return <section className={styles.section} data-city-buying={city} aria-labelledby="city-buying-title">
  <header><p className={styles.eyebrow}>{t(['BUYING DECISION','구매 판단의 시작','购房决策'])}</p><h2 id="city-buying-title">{t(['Why consider this city?','왜 이 도시인가','为什么考虑这座城市？'])}</h2><p>{t(model.why)}</p></header>
  <div className={styles.columns}>
   <article><h3>{t(['The tradeoff to check','함께 봐야 할 제약','同时核查的限制'])}</h3><p>{t(model.tradeoff)}</p><a href={model.source}>{t(['Official source','공식 출처','官方来源'])}</a><small>{t(['Editorial lens · sources checked 15 Sep 2026. No return forecast.','편집 관점 · 출처 확인 2026.09.15 · 수익 전망이 아닙니다.','编辑视角 · 来源核查2026.09.15 · 非回报预测。'])}</small></article>
   <article><h3>{t(['Start with your budget','예산부터 좁혀보기','从预算开始'])}</h3><p>{guide.budgets[locale]}</p><p className={styles.muted}>{city==='tokyo'?'2026 Q1':guide.period[locale]} · {t(['Historical transactions','과거 거래 기준','历史成交'])}</p><Link href={city==='tokyo'?`${prefix}/guides/${comparisonSlug(city)}/`:`${guidePrefix}/guides/${guide.slug}/`}>{t(['Budget examples','예산별 거래 사례','预算成交案例'])}{guidePrefix!==prefix?' · English':''}</Link><Link href={`${prefix}/guides/${comparisonSlug(city)}/`}>{t(model.question)}</Link></article>
   <article><h3>{t(['Before a purchase enquiry','구매상담 전에','购房咨询前'])}</h3><p>{t(model.costs)}</p><Link className={styles.primary} href={consultationHref(city,locale)}>{t(['Prepare a purchase enquiry','구매상담 문의하기','准备购房咨询'])}</Link><small>{t(['Share your budget and questions by email. Service scope is confirmed after enquiry.','예산과 질문을 이메일로 전달하세요. 제공 가능한 도움의 범위는 문의 후 확인합니다.','通过邮件说明预算与问题，具体可提供的服务范围需在咨询后确认。'])}</small></article>
  </div>
 </section>;
}
