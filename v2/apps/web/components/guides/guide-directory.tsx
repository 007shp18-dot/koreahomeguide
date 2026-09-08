import Link from 'next/link';
import { listPracticalGuides } from '../../content/guide-directory';
import type { StoryLocale } from '../../content/city-stories';
import styles from './guide-directory.module.css';

export type GuideMarket = 'all' | 'seoul' | 'singapore' | 'dubai' | 'tokyo';
export function resolveGuideMarket(value?: string): GuideMarket {
  return value === 'seoul' || value === 'singapore' || value === 'dubai' || value === 'tokyo' ? value : 'all';
}

const groups = [
  { id: 'buying', en: 'Buying a home', ko: '집을 살 때', description: { en: 'Eligibility, funding and the purchase process.', ko: '매수 자격부터 자금 준비, 계약과 등기까지.' }, slugs: ['buy-property-in-korea-as-foreigner'] },
  { id: 'renting', en: 'Renting a home', ko: '집을 빌릴 때', description: { en: 'Choose a rental structure and prepare for signing.', ko: '전세·월세를 비교하고 계약 전에 확인할 것.' }, slugs: ['rent-an-apartment-in-korea', 'wolse-vs-jeonse', 'korea-rental-contract-checklist'] },
  { id: 'prices', en: 'Reading property prices', ko: '가격을 확인할 때', description: { en: 'Find comparable sales and understand what the numbers mean.', ko: '비슷한 거래를 찾고 가격 차이를 읽는 방법.' }, slugs: ['read-seoul-sale-transactions', 'read-singapore-private-transactions'] },
] as const;

const guideCopy: Record<string, { en: [string, string]; ko: [string, string] }> = {
  'buy-property-in-korea-as-foreigner': { en: ['Buying in Korea as a foreigner', 'Permission, funding, reporting and registration: what to arrange before each payment.'], ko: ['외국인의 한국 주택 매수 절차', '허가와 자금 준비, 거래 신고, 등기까지 지급 일정에 맞춰 확인합니다.'] },
  'rent-an-apartment-in-korea': { en: ['Renting in Korea, from search to move-in', 'Read Korean listings, ask the right questions at a viewing and prepare for moving day.'], ko: ['한국에서 임대할 집 찾기: 매물 검색부터 입주까지', '매물의 보증금·월세 표기, 면적, 방문할 때 물어볼 내용과 입주 준비를 정리했습니다.'] },
  'wolse-vs-jeonse': { en: ['Jeonse or monthly rent?', 'Compare the cost of the deposit, monthly payments and the cash you need to keep available.'], ko: ['전세와 월세, 내 자금에는 어느 쪽이 맞을까?', '보증금에 들어가는 돈, 매달 나가는 비용과 남겨둘 현금을 함께 비교합니다.'] },
  'korea-rental-contract-checklist': { en: ['Before signing a Korean rental contract', 'A checklist for the owner, payment account, written terms and deposit protection.'], ko: ['임대차 계약서에 서명하기 전 확인할 것', '소유자와 입금 계좌, 특약, 잔금일과 보증금 보호 절차를 차례로 확인합니다.'] },
  'read-seoul-sale-transactions': { en: ['How to compare Seoul transaction prices', 'Match the building, floor area and period, then check the range behind the median.'], ko: ['서울 실거래가 비교하는 법', '같은 건물·면적·기간의 거래를 고르고, 중앙값과 가격 차이를 읽습니다.'] },
  'read-singapore-private-transactions': { en: ['How to read Singapore condo prices', 'Compare projects, tenure and price per square foot, with purchase-duty examples.'], ko: ['싱가포르 콘도 가격과 매입 비용 읽는 법', '단지와 보유권, 면적당 가격을 비교하고 인지세 계산 사례를 확인합니다.'] },
};

export function GuideDirectory({ locale = 'en', market = 'all' }: Readonly<{ locale?: StoryLocale; market?: GuideMarket }>) {
  const ko = locale === 'ko';
  const base = ko ? '/ko/guides/' : '/guides/';
  const cities = [['all', ko ? '전체' : 'All cities'], ['seoul', ko ? '서울' : 'Seoul'], ['singapore', ko ? '싱가포르' : 'Singapore'], ['dubai', ko ? '두바이' : 'Dubai'], ['tokyo', ko ? '도쿄' : 'Tokyo']] as const;
  const marketIds = { all: null, seoul: 'kr-seoul', singapore: 'sg-singapore', dubai: 'ae-dubai', tokyo: 'jp-tokyo' };
  const guides = listPracticalGuides(locale).filter(item => market === 'all' || item.marketId === marketIds[market]);
  return <main className={styles.page} lang={locale} data-guide-directory="practical">
    <header className={styles.header}>
      <p className={styles.eyebrow}>{ko ? '매수·임대 실무 안내' : 'The practical reference'}</p>
      <h1>{ko ? '가이드' : 'Guides'}</h1>
      <p>{ko ? '집을 구하면서 필요한 절차와 비용, 계약 전 확인사항을 찾아보세요.' : 'The steps, costs and checks to have at hand when buying or renting a home.'}</p>
    </header>
    <nav className={styles.cities} aria-label={ko ? '가이드 도시 선택' : 'Guide markets'}>{cities.map(([id, label]) => <Link key={id} href={id === 'all' ? base : `${base}?market=${id}`} aria-current={market === id ? 'page' : undefined}>{label}</Link>)}</nav>
    {groups.map(group => {
      const entries = guides.filter(item => (group.slugs as readonly string[]).includes(item.slug));
      const dubai = group.id === 'buying' && (market === 'all' || market === 'dubai');
      if (!entries.length && !dubai) return null;
      return <section className={styles.group} key={group.id} aria-labelledby={`guide-${group.id}`}>
        <header><h2 id={`guide-${group.id}`}>{group[locale]}</h2><p>{group.description[locale]}</p></header>
        <ul>{entries.map(item => {
          const [title, description] = guideCopy[item.slug]?.[locale] ?? [item.title, item.deck];
          return <li key={item.slug}>
            <p className={styles.eyebrow}>{item.marketId === 'kr-seoul' ? (ko ? '서울' : 'Seoul') : (ko ? '싱가포르' : 'Singapore')}</p>
            <h3><Link href={item.canonicalHref}>{title}</Link></h3><p>{description}</p>
          </li>;
        })}{dubai && <li><p className={styles.eyebrow}>{ko ? '두바이' : 'Dubai'}</p><h3><Link href={ko ? '/ko/ae/dubai/guide/' : '/ae/dubai/guide/'}>{ko ? '두바이 주택 매수 전 확인할 것' : 'Before buying a home in Dubai'}</Link></h3><p>{ko ? '완공 여부와 소유권, 관리비를 확인하고 매입 비용을 준비합니다.' : 'Check completion status, ownership and service charges, then prepare the purchase budget.'}</p></li>}</ul>
      </section>;
    })}
    {market === 'tokyo' && <section className={styles.group}><header><h2>{ko ? '일본 주거 안내' : 'Housing in Japan'}</h2></header><ul><li><p className={styles.eyebrow}>{ko ? '공식 자료 · 일본 출입국재류관리청' : 'Official reference · Immigration Services Agency of Japan'}</p><h3><a href="https://www.moj.go.jp/isa/support/portal/guidebook_all.html">{ko ? '외국인을 위한 생활·취업 가이드북' : 'Guidebook on Living and Working'}</a></h3><p>{ko ? '주거와 임대 계약에 관한 안내는 공식 가이드북의 주거 항목에서 확인할 수 있습니다.' : 'Consult the housing chapter for accommodation and rental-contract guidance.'}</p></li></ul></section>}
    <footer className={styles.footer}><p>{ko ? '동네의 분위기나 예산별 집이 궁금하다면' : 'Looking for neighbourhood stories or homes at your budget?'}</p><Link href={`${ko ? '/ko' : ''}/news/${market === 'all' ? '' : `?market=${market}`}`}>{ko ? '뉴스 & 인사이트' : 'News & Insights'} →</Link></footer>
  </main>;
}
