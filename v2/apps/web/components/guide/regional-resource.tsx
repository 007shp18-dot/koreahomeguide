import Link from 'next/link';
import { REGIONAL_RESOURCES, RESOURCE_CITIES, RESOURCE_LABELS, RESOURCE_TYPES, regionalResourceHref, type GuideResource } from '../../content/regional-guide-resources';
import type { StoryCity, StoryLocale } from '../../content/city-stories';
import { LOCAL_TERMS } from '../../content/regional-guide-depth';
import guideStyles from './editorial-guides.module.css';
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
    <header className={guideStyles.heading}><h1>{title}</h1><p>{data.intro[locale]}</p></header>
    <nav className={styles.switcher} aria-label={ko ? '자료 유형' : 'Resource type'}>{RESOURCE_TYPES.map(type => <Link key={type} href={regionalResourceHref(city, type, locale)} aria-current={resource === type ? 'page' : undefined}>{RESOURCE_LABELS[type][locale]}</Link>)}</nav>
    {resource === 'checklist' ? <>
      <p className={styles.note}>{ko ? '자료를 받아 확인한 항목에 체크하세요. 체크 상태는 별도로 저장되지 않으며, 이 목록만으로 계약이나 건물의 안전성이 검증되는 것은 아닙니다.' : 'Tick an item after checking the evidence. Checks are not saved. Completing this list does not verify a contract or a building’s condition.'}</p>
      <h2>{ko ? '매물·비용 기본 확인' : 'Property & cost essentials'}</h2>
      <ol className={styles.checklist}>{data.checklist.map((entry, index) => <li key={entry.title.en}><label><input type="checkbox" name={`check-${city}-${index + 1}`} /><span><strong>{entry.title[locale]}</strong>{entry.description[locale]}</span></label></li>)}</ol>
      <h2>{ko ? `${data.name.ko} 권리·계약·자금 확인` : `${data.name.en}: rights, contracts & funding`}</h2>
      <p className={styles.note}>{ko ? '내 거래에 해당하는 항목을 확인하세요. 적용되지 않는 요건을 모두 충족할 필요는 없습니다.' : 'Check the items that apply to your transaction; not every condition applies to every buyer or property.'}</p>
      <ol className={styles.checklist}>{LOCAL_TERMS[city].map(entry => <li key={entry.id} id={`check-${entry.id}`}><label><input type="checkbox" name={`check-${city}-${entry.id}`} /><span><strong>{entry.title[locale]}</strong>{entry.verify[locale]}</span></label><p className={styles.termLink}><Link href={`${regionalResourceHref(city, 'glossary', locale)}#${entry.id}`}>{ko ? '용어 뜻과 확인 이유' : 'Meaning & why it matters'}</Link></p></li>)}</ol>
    </> : <>
      <p className={styles.note}>{ko ? `${data.glossary.length + LOCAL_TERMS[city].length}개 핵심 용어 · 기본 용어부터 권리·계약·세금·금융까지` : `${data.glossary.length + LOCAL_TERMS[city].length} key terms · basics, rights, contracts, taxes and finance`}</p>
      <nav className={styles.termIndex} aria-label={ko ? '용어 찾아보기' : 'Browse terms'}>{data.glossary.map((entry, index) => <a key={entry.title.en} href={`#basic-${index}`}>{entry.title[locale]}</a>)}{LOCAL_TERMS[city].map(entry => <a key={entry.id} href={`#${entry.id}`}>{entry.title[locale]}</a>)}</nav>
      <dl className={styles.glossary}>{data.glossary.map((entry, index) => <div key={entry.title.en} id={`basic-${index}`}><dt>{entry.title[locale]}</dt><dd>{entry.description[locale]}</dd></div>)}{LOCAL_TERMS[city].map(entry => <div key={entry.id} id={entry.id}><dt>{entry.title[locale]}</dt><dd>{entry.meaning[locale]}<p><strong>{ko ? '확인할 것' : 'What to verify'}</strong><br />{entry.verify[locale]}</p><Link href={`${regionalResourceHref(city, 'checklist', locale)}#check-${entry.id}`}>{ko ? '체크리스트에서 확인하기' : 'Open this checklist item'}</Link></dd></div>)}</dl>
    </>}
    <section><h2>{ko ? '지역별 상세 확인' : 'Local guidance & sources'}</h2><p className={styles.note}>{ko ? '개념 설명과 확인 질문입니다. 적용 요건·세율·신고 기한은 거래 시점의 공식 자료로 확인하세요.' : 'Definitions and verification prompts. Check applicable conditions, rates and filing deadlines against official guidance at the transaction date.'}</p><ul className={styles.sourceLinks}>{['can-i-buy', 'which-home', 'make-it-happen'].map((step, index) => <li key={step}><Link href={`${ko ? '/ko' : ''}/news/city-stories/${city}/${step}/`}>{(ko ? ['자격·예산과 공식 자료', '매물·건물 관리와 공식 자료', '계약·등기와 공식 자료'] : ['Eligibility, budget & official references', 'Property condition & official references', 'Contracts, registration & official references'])[index]}</Link></li>)}{city === 'singapore' && <><li><a href="https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer's-stamp-duty-(absd)">IRAS · ABSD</a></li><li><a href="https://www.iras.gov.sg/taxes/stamp-duty/for-property/selling-or-disposing-property/seller's-stamp-duty-(ssd)-for-residential-property">IRAS · SSD</a></li></>}{city === 'dubai' && <li><a href="https://dubailand.gov.ae/en/frequently-asked-questions/">Dubai Land Department · FAQ</a></li>}</ul></section>
    <section><h2>{ko ? '이어서 읽기' : 'Read the detailed guide'}</h2><p><Link href={`${ko ? '/ko' : ''}${data.related}`}>{ko ? `${data.name.ko} 비용·서류 확인 가이드` : `${data.name.en}: costs, documents and worked examples`}</Link></p><p className={styles.note}>{ko ? '구체적인 절차와 비용, 출처는 연결된 상세 가이드에서 확인하세요. 실제 조건은 해당 매물의 최신 문서로 확인해야 합니다.' : 'Find the context, examples and sources in the linked guide. Confirm actual conditions against current documents for the property.'}</p></section>
  </main>;
}
