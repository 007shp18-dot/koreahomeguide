import Image from 'next/image';
import Link from 'next/link';
import { getJourneyArticle } from '../../content/city-journey-articles';
import { journeyArticleHref } from '../../content/city-journey-routes';
import type { StoryCity } from '../../content/city-stories';
import type { ContentLocale } from '../../lib/content/content-types';
import { guideDirectory } from '../../content/guide-directory';
import { listPortfolioRecords } from '../../content/portfolio-manifest';
import { REGIONAL_RESOURCES, RESOURCE_TYPES, RESOURCE_LABELS, regionalResourceHref } from '../../content/regional-guide-resources';
import { createPropertyScenarioHref } from '../../lib/tools/property-scenario-context';
import { MARKET_PHOTOS } from '../market-representative-photo';
import { BudgetGuideCallout } from './budget-guide-callout';
import styles from './editorial-guides.module.css';

const cities = { seoul: ['Seoul', '서울', '首尔'], singapore: ['Singapore', '싱가포르', '新加坡'], dubai: ['Dubai', '두바이', '迪拜'], tokyo: ['Tokyo', '도쿄', '东京'] } as const;
const explore = { seoul: '/kr/seoul/explore/', tokyo: '/jp/tokyo/explore/', singapore: '/sg/singapore/explore/', dubai: '/ae/dubai/explore/' } as const;
const toolMarkets = { seoul: { market: 'kr-seoul', currency: 'KRW' }, singapore: { market: 'sg-singapore', currency: 'SGD' }, dubai: { market: 'ae-dubai', currency: 'AED' }, tokyo: { market: 'jp-tokyo', currency: 'JPY' } } as const;
type Entry = { id: string; title: string; deck: string; href: string; label: string };

export function EditorialGuides({ market, query = '', locale = 'en' }: Readonly<{ market: StoryCity; query?: string; locale?: ContentLocale }>) {
  const ko = locale === 'ko';
  const zh = locale === 'zh-CN';
  const prefix = ko ? '/ko' : zh ? '/zh-cn' : '';
  const language = ko ? 1 : zh ? 2 : 0;
  const contentLocale = ko ? 'ko' : 'en';
  const t = (en: string, kr: string, cn: string) => ko ? kr : zh ? cn : en;
  const city = cities[market][language];
  const photo = MARKET_PHOTOS[market];
  const search = query.trim().toLocaleLowerCase(locale);
  const matches = (entry: Entry) => !search || `${entry.title} ${entry.deck} ${entry.label}`.toLocaleLowerCase(locale).includes(search);
  const before: Entry[] = [
    { id: 'can-i-buy', label: t('Eligibility & budget', '자격과 예산', '资格与预算') },
    { id: 'which-home', label: t('Compare homes', '주택 비교', '比较住宅') },
    { id: 'make-it-happen', label: t('Contracts & completion', '계약과 잔금', '合同与交割') },
  ].flatMap(({ id, label }) => {
    const article = getJourneyArticle(market, id);
    return article ? [{ id, label: `${label}${zh ? '（英文）' : ''}`, title: article.title[contentLocale], deck: article.deck[contentLocale], href: journeyArticleHref(market, id, contentLocale) }] : [];
  });
  const owning: Entry[] = [
    { id: 'cost-tool', label: t('Calculator', '계산기', '计算器'), title: t('Build your ownership-cost scenario', '매입·보유 비용 계산하기', '计算购房与持有成本'), deck: t('Work through purchase outlay and rental income using your own assumptions.', '집값과 실제 비용을 입력하고, 매입 지출과 임대수익을 구분해 확인하세요.', '输入自己的价格与费用假设，分别核对购置支出与租赁收入。'), href: createPropertyScenarioHref({ locale, ...toolMarkets[market] }) },
  ];
  const essential: Entry[] = guideDirectory(contentLocale, market).map(entry => {
    const original = listPortfolioRecords(contentLocale).find(record => record.canonicalHref === entry.href);
    const translated = zh ? listPortfolioRecords('zh-CN').find(record => original?.translationGroupId && record.translationGroupId === original.translationGroupId) : undefined;
    return { ...entry, ...(translated ? { title: translated.title, deck: translated.deck, href: translated.canonicalHref } : {}), label: `${entry.group === 'buy' ? t('Buying', '매수', '购房') : t('Renting', '임대차', '租房')}${zh && !translated ? '（英文）' : ''}` };
  });
  const groups = [
    { id: 'before-buying', title: t('Before you buy', '매수 전 준비', '购房前准备'), entries: before },
    { id: 'owning', title: t('Owning & ongoing costs', '매입·보유 비용', '购置与持续持有成本'), entries: owning },
    { id: 'essential', title: t(`Essential ${city} guides`, `${city} 매수·임대차 가이드`, `${city}实用指南`), entries: essential },
    { id: 'resources', title: t('Reference & checklists', '체크리스트와 용어집', '参考资料与清单'), entries: RESOURCE_TYPES.map(resource => ({ id: resource, label: `${RESOURCE_LABELS[resource][contentLocale]}${zh ? '（英文）' : ''}`, title: `${city} ${RESOURCE_LABELS[resource][contentLocale].toLowerCase()}`, deck: resource === 'checklist' ? REGIONAL_RESOURCES[market].intro[contentLocale] : t('Local ownership, contracts, taxes, financing and building-management terms, with checks to make for each.', '소유권·계약·세금·금융·건물 관리 용어의 뜻과 확인할 사항을 살펴보세요.', '了解当地所有权、合同、税费、融资与楼宇管理术语及对应核查问题。'), href: regionalResourceHref(market, resource, contentLocale) })) },
  ].map(group => ({ ...group, entries: group.entries.filter(matches) }));

  return <main className={styles.page} lang={locale}>
    <header className={styles.heading}><h1>{t('Guides', '매수·임대차 가이드', '买房与租房指南')}</h1><p>{t('Practical steps for buying, owning and renting a home.', '집을 사거나 빌리기 전, 비용과 서류부터 계약·입주 절차까지 확인하세요.', '从预算与文件到签约、交割和入住，逐步准备。')}</p></header>
    <nav className={styles.tabs} aria-label={t('Guide cities', '가이드 도시', '指南城市')}>
      {(Object.keys(cities) as StoryCity[]).map(key => <Link key={key} href={`${prefix}/guides/?market=${key}`} aria-current={key === market ? 'page' : undefined}>{cities[key][language]}</Link>)}
    </nav>
    <BudgetGuideCallout locale={locale} market={market} />
    <form className={styles.search} action={`${prefix}/guides/`} method="get" role="search">
      <input type="hidden" name="market" value={market} />
      <label htmlFor="guide-query">{t(`Find a ${city} guide`, `${city} 가이드 검색`, `查找${city}指南`)}</label>
      <div><input id="guide-query" name="q" type="search" defaultValue={query} placeholder={t('What do you need help with?', '어떤 정보가 필요하세요?', '需要了解什么？')} maxLength={120} /><button type="submit">{t('Search', '검색', '搜索')}</button></div>
    </form>
    <section className={styles.intro} aria-labelledby="city-guide-title">
      <div className={styles.photo}><Image src={photo.src} alt={photo.alt} fill priority sizes="(max-width: 640px) calc(100vw - 40px), 360px" style={{ objectFit: 'cover', objectPosition: `${photo.focalPoint.x}% ${photo.focalPoint.y}%` }} /></div>
      <div><p className={styles.label}>{city} · {t('Practical guidance', '실용 가이드', '实用指南')}</p><h2 id="city-guide-title">{t(`Your next steps in ${city}`, `${city}에서 집을 구하는 순서`, `在${city}的下一步`)}</h2><p>{t('Check your buying conditions, compare homes and plan the costs before you commit.', '매수 조건을 확인하고 주택을 비교한 뒤 계약 전 비용과 서류를 준비하세요.', '先核对购买条件、比较住宅，再准备费用和签约文件。')}</p></div>
    </section>
    {search && <p className={styles.searchStatus}>{t(`Results for “${query.trim()}” in ${city}.`, `${city} “${query.trim()}” 검색 결과`, `${city}“${query.trim()}”的搜索结果`)} <Link href={`${prefix}/guides/?market=${market}`}>{t('Clear search', '검색 지우기', '清除搜索')}</Link></p>}
    {groups.every(group => !group.entries.length) && <p className={styles.empty}>{t('No matching guides. Try “cost”, “buy” or a different city.', '일치하는 가이드가 없습니다. 다른 검색어나 도시를 선택해 보세요.', '没有匹配指南，请更换关键词或城市。')}</p>}
    {groups.filter(group => group.entries.length).map(group => <section key={group.id} className={styles.section} aria-labelledby={group.id}>
      <h2 id={group.id}>{group.title}</h2>
      <ul className={group.id === 'essential' || group.id === 'resources' ? styles.rows : styles.cards}>{group.entries.map(entry => <li key={entry.id}><Link href={entry.href} className={styles.entry}>
        <span className={styles.label}>{entry.label}</span><h3>{entry.title}</h3><p>{entry.deck}</p><span className={styles.read}>{entry.id === 'cost-tool' ? t('Open calculator', '계산기 열기', '打开计算器') : t('Read guide', '가이드 읽기', '阅读指南')} <span aria-hidden="true">→</span></span>
      </Link></li>)}</ul>
    </section>)}
    <nav className={styles.next} aria-label={t('Continue exploring', '이어서 살펴보기', '继续探索')}><Link href={`${prefix}${explore[market]}`}>{t(`Explore ${city}`, `${city} 실거래가 탐색`, `查看${city}成交`)} <span aria-hidden="true">→</span></Link><Link href={`${prefix}/news/?market=${market}`}>{t(`Read ${city} insights`, `${city} 인사이트 읽기`, `阅读${city}洞察`)} <span aria-hidden="true">→</span></Link></nav>
  </main>;
}
