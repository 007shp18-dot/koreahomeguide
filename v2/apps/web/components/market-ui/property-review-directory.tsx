import Link from 'next/link';
import type { MarketLocale } from '../../lib/locale/market-localization';
import type { PropertyReviewDirectoryEntry } from '../../lib/research/property-review-profile';
import { actualDetailHref } from '../../lib/research/property-review-locations';
import styles from './property-review-detail.module.css';

function normalized(value: string) {
  return value.normalize('NFKC').replace(/[\s\p{P}]+/gu, '').toLocaleLowerCase('en');
}

export function PropertyReviewDirectory({ entries, locale, query = '' }: Readonly<{
  entries: readonly PropertyReviewDirectoryEntry[];
  locale: MarketLocale;
  query?: string;
}>) {
  const term = normalized(query);
  const matches = entries.filter(entry => !term || normalized([
    entry.id, entry.name.en, entry.name.ko, entry.area.en, entry.area.ko,
  ].join(' ')).includes(term));
  if (!matches.length) return null;
  const lang = locale === 'ko' ? 'ko' : 'en';
  const title = locale === 'ko' ? '단지별 상세 정보' : locale === 'zh-CN' ? '住宅项目详情' : 'Property details';
  return <section className={styles.directory} aria-label={title} data-named-property-directory="true">
    <h2>{title}</h2>
    <p>{locale === 'ko' ? '단지를 선택해 입지·학교·생활환경을 확인하세요.' : locale === 'zh-CN' ? '选择住宅项目，了解区位、学校与日常生活。' : 'Choose a property to explore its location, schools and daily surroundings.'}</p>
    <ul>{matches.flatMap(entry => {
      const href = actualDetailHref(locale, entry.id);
      return href ? [<li key={entry.id}><Link href={href}>
        <span><strong>{entry.name[lang]}</strong><small>{entry.area[lang]}</small></span>
        <span aria-hidden="true">→</span>
      </Link></li>] : [];
    })}</ul>
  </section>;
}
