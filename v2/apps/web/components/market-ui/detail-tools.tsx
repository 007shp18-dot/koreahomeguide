import { localizedMarketCopy } from '../../lib/locale/market-localization';
import { PassportLink as Link } from '../passport/passport-journey';
import styles from './detail-layout.module.css';

export function DetailTools({ locale = 'en', id = 'detail-tools', checkHref, calculatorHref }: Readonly<{
  locale?: 'en' | 'ko' | 'zh-CN';
  id?: string;
  checkHref: string;
  calculatorHref?: string;
}>) {
  return <section id={id} className={styles.section} data-detail-order="tools" aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`}>{localizedMarketCopy(locale, "Compare with your own numbers", "내 조건으로 비교하기")}</h2>
    <div className={styles.tools}>
      <article className={styles.tool}>
        <h3>{localizedMarketCopy(locale, "Asking price comparison", "매물 가격 비교")}</h3>
        <p>{localizedMarketCopy(locale, "Check an asking price against reported transactions.", "관심 매물의 가격을 신고 거래와 비교하세요.")}</p>
        <Link href={checkHref}>{localizedMarketCopy(locale, "Compare an asking price", "가격 비교 열기")}</Link>
      </article>
      {calculatorHref ? <article className={styles.tool}>
        <h3>{localizedMarketCopy(locale, "Purchase costs and rental income", "매수 비용·임대수익 계산")}</h3>
        <p>{localizedMarketCopy(locale, "Adjust the purchase price and rent to estimate taxes, costs and rental income.", "매수가와 임대료를 조정해 세금·비용·예상 수익을 계산하세요.")}</p>
        <Link href={calculatorHref}>{localizedMarketCopy(locale, "Open calculator", "계산기 열기")}</Link>
      </article> : null}
    </div>
  </section>;
}
