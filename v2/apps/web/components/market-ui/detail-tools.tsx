import { PassportLink as Link } from '../passport/passport-journey';
import styles from './detail-layout.module.css';

export function DetailTools({ locale = 'en', id = 'detail-tools', checkHref, calculatorHref }: Readonly<{
  locale?: 'en' | 'ko';
  id?: string;
  checkHref: string;
  calculatorHref?: string;
}>) {
  const ko = locale === 'ko';
  return <section id={id} className={styles.section} data-detail-order="tools" aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`}>{ko ? '내 조건으로 비교하기' : 'Compare with your own numbers'}</h2>
    <div className={styles.tools}>
      <article className={styles.tool}>
        <h3>{ko ? '매물 가격 비교' : 'Asking price comparison'}</h3>
        <p>{ko ? '관심 매물의 가격을 신고 거래와 비교하세요.' : 'Check an asking price against reported transactions.'}</p>
        <Link href={checkHref}>{ko ? '가격 비교 열기' : 'Compare an asking price'}</Link>
      </article>
      {calculatorHref ? <article className={styles.tool}>
        <h3>{ko ? '매수 비용·임대수익 계산' : 'Purchase costs and rental income'}</h3>
        <p>{ko ? '매수가와 임대료를 조정해 세금·비용·예상 수익을 계산하세요.' : 'Adjust the purchase price and rent to estimate taxes, costs and rental income.'}</p>
        <Link href={calculatorHref}>{ko ? '계산기 열기' : 'Open calculator'}</Link>
      </article> : null}
    </div>
  </section>;
}
