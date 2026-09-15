import type { PropertyReview } from '../../lib/research/property-review';
import type { MarketLocale } from '../../lib/locale/market-localization';
import { propertyOverview } from '../../lib/research/property-overview';
import styles from './property-overview-card.module.css';

export function PropertyOverviewCard({ id, locale, checkedOn, editorial, compact = false }: {
  id: string; locale: MarketLocale; checkedOn?: string; editorial?: PropertyReview['editorial']; compact?: boolean;
}) {
  const overview = propertyOverview(id, locale, checkedOn);
  if (!overview && !editorial) return null;
  const t = (ko: string, en: string, zh: string) => locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;
  const labels: Record<string, string> = {
    transport: t('교통', 'Transport', '交通'), schools: t('학교', 'Schools', '学校'), daily: t('생활', 'Daily life', '生活'),
  };
  const title = t('단지 한눈에 보기', 'Life at this property', '项目生活概览');
  return <section className={styles.overview} data-property-overview={id} data-compact={compact} aria-label={title}>
    {!compact && <h3>{title}</h3>}
    {editorial ? <div data-property-editorial={editorial.revisedOn} lang={locale === 'ko' ? 'ko' : 'en'}>
      {locale === 'zh-CN' && <p>本分析目前提供英文和韩文，以下为英文内容。</p>}
      {editorial.paragraphs[locale === 'ko' ? 'ko' : 'en'].map((paragraph, index) => <p key={index} className={index === 0 ? styles.impression : undefined}>{paragraph}</p>)}
    </div> : overview && <><p className={styles.impression}>{overview.impression}</p>
    <dl>{overview.highlights.map(item => <div key={item.topic}>
      <dt>{labels[item.topic]}</dt><dd>{item.text}</dd>
    </div>)}</dl></>}
  </section>;
}
