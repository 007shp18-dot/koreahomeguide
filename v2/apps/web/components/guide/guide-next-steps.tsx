import Link from 'next/link';
import type { ContentLocale } from '../../lib/content/content-types';
import type { StoryCity } from '../../content/city-stories';
import { createPropertyScenarioHref } from '../../lib/tools/property-scenario-context';
import { regionalResourceHref } from '../../content/regional-guide-resources';
import { getPortfolioRecord } from '../../content/portfolio-manifest';
import styles from '../newsroom/journey-article.module.css';

const markets = {
  seoul: { market: 'kr-seoul', currency: 'KRW', explore: '/kr/seoul/explore/' },
  singapore: { market: 'sg-singapore', currency: 'SGD', explore: '/sg/singapore/explore/' },
  dubai: { market: 'ae-dubai', currency: 'AED', explore: '/ae/dubai/explore/' },
  tokyo: { market: 'jp-tokyo', currency: 'JPY', explore: '/jp/tokyo/explore/' },
} as const;

export function GuideNextSteps({ city, locale, renting = false }: { city: StoryCity; locale: ContentLocale; renting?: boolean }) {
  const ko = locale === 'ko';
  const zh = locale === 'zh-CN';
  const prefix = ko ? '/ko' : zh ? '/zh-cn' : '';
  const t = (en: string, kr: string, cn: string) => ko ? kr : zh ? cn : en;
  const market = markets[city];
  const rental = getPortfolioRecord(locale, zh ? 'wolse-vs-jeonse-zh' : 'wolse-vs-jeonse');
  const checklist = renting ? getPortfolioRecord(locale, 'korea-rental-contract-checklist')?.canonicalHref : null;
  const resourceLocale = ko ? 'ko' : 'en';
  return <section className={styles.related} data-guide-next-steps={city} aria-labelledby="guide-next-steps">
    <h2 id="guide-next-steps">{t('Put this guide into practice', '내 조건으로 이어서 확인하기', '将指南用于自己的情况')}</h2>
    <ol>
      <li>{renting ? <><Link href={`${prefix}${market.explore}?transaction=jeonse`}>{t('Compare jeonse deposits', '전세보증금 비교하기', '比较全租押金')}</Link>{' · '}<Link href={`${prefix}${market.explore}?transaction=monthly`}>{t('Compare monthly rents', '월세 비교하기', '比较月租')}</Link></> : <Link href={`${prefix}${market.explore}`}>{t('Compare the transaction evidence', '같은 조건의 실거래 비교하기', '比较相同条件的成交')}</Link>}<p>{t('Keep the period, property type and area basis together. Historical sales are comparison evidence, not available listings.', '거래 기간·주택 유형·면적 기준을 맞춰 비교하세요. 과거 거래 사례는 현재 매물 목록이 아닙니다.', '统一成交时期、住宅类型与面积口径。历史成交是比较依据，并非在售房源。')}</p></li>
      <li><Link href={renting && rental ? rental.canonicalHref : createPropertyScenarioHref({ locale, market: market.market, currency: market.currency })}>{renting ? t('Compare deposit and monthly costs', '보증금과 월 지출 비교하기', '比较押金与每月支出') : t('Build a full purchase-cost scenario', '집값·세금·보유 비용 계산하기', '计算购房与持有成本')}</Link><p>{renting ? t('Separate refundable deposit cash from rent, management fees and deposit-financing costs.', '반환받을 보증금과 월세·관리비·보증금 조달 비용을 나누어 적으세요.', '将可退押金与租金、管理费及押金融资成本分开。') : t('Enter your own price and verified fee amounts. Keep cash available after completion and recurring costs separate from the purchase price.', '실제 후보 가격과 확인한 비용을 입력하세요. 집값과 잔금 후 남길 현금·반복 지출을 구분하세요.', '输入候选房屋价格和已核实费用，将房价与交割后保留现金、持续支出分开。')}</p></li>
      <li><Link href={checklist ?? regionalResourceHref(city, 'checklist', resourceLocale)}>{t('Check documents before committing', '계약 전 서류·일정 점검하기', '签约前核对文件与时间安排')}{zh && !checklist ? '（英文）' : ''}</Link><p>{t('Record the documents received, payment dates and unresolved questions for the actual property.', '실제 후보의 확인 서류·지급 일정·아직 해결하지 못한 질문을 정리하세요.', '记录实际物业已收到的文件、付款日期与尚未解决的问题。')}</p></li>
    </ol>
    <Link href={`${prefix}/guides/?market=${city}`}>{t('Back to this city’s guides', '이 도시의 가이드 더 보기', '返回本城市指南')}</Link>
  </section>;
}
