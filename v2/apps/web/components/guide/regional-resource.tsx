import Link from 'next/link';
import { REGIONAL_RESOURCES, RESOURCE_CITIES, RESOURCE_LABELS, RESOURCE_TYPES, regionalResourceHref, type GuideResource } from '../../content/regional-guide-resources';
import type { StoryCity, StoryLocale } from '../../content/city-stories';
import styles from './regional-resource.module.css';

export function RegionalResourceLinks({ city, locale }: { city: StoryCity | 'all'; locale: StoryLocale }) {
  const selected = city === 'all' ? RESOURCE_CITIES : [city];
  return <section className={styles.directory} aria-labelledby="regional-resources-title"><h2 id="regional-resources-title">{locale === 'ko' ? '체크리스트와 용어집' : 'Checklists & glossaries'}</h2><ul>{selected.map(key => <li key={key}><span>{REGIONAL_RESOURCES[key].name[locale]}</span><nav aria-label={`${REGIONAL_RESOURCES[key].name[locale]} ${locale === 'ko' ? '가이드 자료' : 'guide resources'}`}>{RESOURCE_TYPES.map(resource => <Link key={resource} href={regionalResourceHref(key, resource, locale)}>{RESOURCE_LABELS[resource][locale]}</Link>)}</nav></li>)}</ul></section>;
}

export function RegionalResource({ city, resource, locale }: { city: StoryCity; resource: GuideResource; locale: StoryLocale }) {
  const data = REGIONAL_RESOURCES[city];
  const ko = locale === 'ko';
  const title = `${data.name[locale]} ${RESOURCE_LABELS[resource][locale]}`;
  return <main className={styles.page} lang={locale}>
    <nav className={styles.breadcrumb} aria-label={ko ? '현재 위치' : 'Breadcrumb'}><Link href={`${ko ? '/ko' : ''}/guides/`}>{ko ? '가이드' : 'Guides'}</Link><Link href={`${ko ? '/ko' : ''}/guides/?market=${city}`}>{data.name[locale]}</Link><span>{RESOURCE_LABELS[resource][locale]}</span></nav>
    <header><h1>{title}</h1><p>{data.intro[locale]}</p></header>
    <nav className={styles.switcher} aria-label={ko ? '자료 유형' : 'Resource type'}>{RESOURCE_TYPES.map(type => <Link key={type} href={regionalResourceHref(city, type, locale)} aria-current={resource === type ? 'page' : undefined}>{RESOURCE_LABELS[type][locale]}</Link>)}</nav>
    {resource === 'checklist' ? <>
      <p className={styles.note}>{ko ? '자료를 받아 확인한 항목에 체크하세요. 체크 상태는 별도로 저장되지 않으며, 이 목록만으로 계약이나 건물의 안전성이 검증되는 것은 아닙니다.' : 'Tick an item after checking the evidence. Checks are not saved. Completing this list does not verify a contract or a building’s condition.'}</p>
      <ol className={styles.checklist}>{data.checklist.map((entry, index) => <li key={entry.title.en}><label><input type="checkbox" name={`check-${city}-${index + 1}`} /><span><strong>{entry.title[locale]}</strong>{entry.description[locale]}</span></label></li>)}</ol>
    </> : <dl className={styles.glossary}>{data.glossary.map(entry => <div key={entry.title.en}><dt>{entry.title[locale]}</dt><dd>{entry.description[locale]}</dd></div>)}</dl>}
    <section><h2>{ko ? '이어서 읽기' : 'Read the detailed guide'}</h2><p><Link href={`${ko ? '/ko' : ''}${data.related}`}>{ko ? `${data.name.ko} 비용·서류 확인 가이드` : `${data.name.en}: costs, documents and worked examples`}</Link></p><p className={styles.note}>{ko ? '구체적인 절차와 비용, 출처는 연결된 상세 가이드에서 확인하세요. 실제 조건은 해당 매물의 최신 문서로 확인해야 합니다.' : 'Find the context, examples and sources in the linked guide. Confirm actual conditions against current documents for the property.'}</p></section>
  </main>;
}
