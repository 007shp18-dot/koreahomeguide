import Link from 'next/link';
import type { EditorialGrowthReviewModel } from '@/lib/design-review/editorial-growth-review-model';
import styles from './editorial-growth-review.module.css';

const COPY = Object.freeze({
  en: {
    eyebrow: 'Seoul evidence check',
    title: 'Check a price against reported contracts.',
    lead: 'Set the home conditions first. SignedPrice will show the comparison boundary before the figures.',
    transaction: 'Transaction',
    district: 'District',
    housing: 'Home type',
    area: 'Floor area',
    price: 'Asking price',
    submit: 'Check this price',
    comparison: 'Comparison scope',
    figures: 'Key figures',
    evidence: 'Evidence window',
    disclosure: 'What this result means',
    next: 'Explore reported evidence',
    transactionRent: 'Rent / Jeonse',
    transactionSale: 'Purchase',
    apartment: 'Apartment',
    officetel: 'Officetel',
    amount: 'Enter amount',
    explanation: 'A comparison describes compatible reported contracts. It does not certify a home or predict a final price.',
    gangnam: 'Gangnam-gu',
    mapo: 'Mapo-gu',
  },
  'zh-CN': {
    eyebrow: '首尔成交依据查询',
    title: '用已申报合同核对价格。',
    lead: '先输入住宅条件。SignedPrice 会在显示数字前说明可比范围。',
    transaction: '交易类型',
    district: '行政区',
    housing: '住宅类型',
    area: '建筑面积',
    price: '报价',
    submit: '查询这个价格',
    comparison: '可比范围',
    figures: '关键数字',
    evidence: '数据期间',
    disclosure: '如何理解结果',
    next: '探索已申报数据',
    transactionRent: '月租 / 全租',
    transactionSale: '购买',
    apartment: '公寓',
    officetel: '办公住宅',
    amount: '输入金额',
    explanation: '该比较只描述条件相近的已申报合同，不是住宅认证，也不预测最终成交价。',
    gangnam: '江南区',
    mapo: '麻浦区',
  },
});

export function EditorialGrowthCheck({ model }: Readonly<{ model: EditorialGrowthReviewModel }>) {
  const copy = COPY[model.locale];
  const query = `locale=${model.locale}&state=${model.state}&ad=${model.ad}`;

  return (
    <main className={styles.checkPage}>
      <header className={styles.toolIntro}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 className={styles.display}>{copy.title}</h1>
        <p className={`${styles.lead} ${styles.toolLead}`}>{copy.lead}</p>
      </header>

      <div className={styles.checkWorkspace}>
        <form className={styles.checkForm} data-check-region="input">
          <label>
            <span>{copy.transaction}</span>
            <select defaultValue="rent">
              <option value="rent">{copy.transactionRent}</option>
              <option value="sale">{copy.transactionSale}</option>
            </select>
          </label>
          <label>
            <span>{copy.district}</span>
            <select defaultValue="gangnam">
              <option value="gangnam">{copy.gangnam}</option>
              <option value="mapo">{copy.mapo}</option>
            </select>
          </label>
          <label>
            <span>{copy.housing}</span>
            <select defaultValue="apartment">
              <option value="apartment">{copy.apartment}</option>
              <option value="officetel">{copy.officetel}</option>
            </select>
          </label>
          <label>
            <span>{copy.area}</span>
            <div className={styles.inputWithUnit}>
              <input defaultValue="84" inputMode="decimal" aria-label={`${copy.area} in square metres`} />
              <span>m²</span>
            </div>
          </label>
          <label>
            <span>{copy.price}</span>
            <div className={styles.inputWithUnit}>
              <input placeholder={copy.amount} inputMode="numeric" aria-label={`${copy.price} in Korean won`} />
              <span>KRW</span>
            </div>
          </label>
          <button className={styles.primaryAction} type="button">{copy.submit}</button>
        </form>

        <section className={styles.checkResult} data-result-state={model.check.state} aria-live="polite">
          {model.check.state === 'ready' ? (
            <>
              <header data-check-region="verdict">
                <p className={styles.eyebrow}>{model.seoulStatus}</p>
                <h2 className={styles.sectionTitle}>{model.check.verdict}</h2>
                <p><strong>{copy.comparison}:</strong> {model.check.scope}</p>
              </header>
              <dl className={styles.checkMetrics} data-check-region="figures" aria-label={copy.figures}>
                {model.check.metrics.slice(0, 3).map((metric) => (
                  <div key={metric.label}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                    <p>{metric.context}</p>
                  </div>
                ))}
              </dl>
              <div className={styles.checkEvidence} data-check-region="evidence">
                <h3 className={styles.subheading}>{copy.evidence}</h3>
                <p>{model.check.disclosure}</p>
              </div>
              <aside className={styles.checkDisclosure} data-check-region="disclosure">
                <strong>{copy.disclosure}</strong>
                <p>{copy.explanation}</p>
              </aside>
            </>
          ) : (
            <div className={styles.nonNumericState} data-check-region="verdict">
              <p className={styles.eyebrow}>{model.check.scope}</p>
              <h2 className={styles.sectionTitle}>{model.check.verdict}</h2>
              <p>{model.check.disclosure}</p>
              <Link className={styles.textAction} href={`/design-review/editorial-growth/explore/?${query}`}>
                {copy.next}<span aria-hidden="true"> →</span>
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
