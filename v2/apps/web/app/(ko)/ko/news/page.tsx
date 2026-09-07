import Link from 'next/link';
import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { ResearchPageHeading } from '@/components/market-ui/research-page-heading';
import { listPortfolioRecords } from '@/content/portfolio-manifest';
import { indexableMetadata } from '@/lib/public-metadata';
import styles from '@/components/tools/tools.module.css';
export const metadata = indexableMetadata({ path: '/ko/news/', title: '부동산 뉴스와 시장 분석 | signedprice', description: '서울·싱가포르·두바이의 정책 소식과 시장 보고서, 데이터 분석을 출처와 함께 확인하세요.', languageAlternates: { en: '/news/', ko: '/ko/news/', 'zh-Hans': '/zh-cn/news/' }, locale: 'ko_KR', imagePath: '/og/ko/' });
const types = [['all', '전체'], ['analysis', '시장 분석'], ['policy-update', '정책 소식'], ['market-brief', '시장 보고서'], ['data-story', '데이터 분석']] as const;
const markets = [['all', '모든 도시'], ['seoul', '서울'], ['singapore', '싱가포르'], ['dubai', '두바이']] as const;
const marketIds: Record<string, string> = { seoul: 'kr-seoul', singapore: 'sg-singapore', dubai: 'ae-dubai' };
export default async function Page({ searchParams }: { searchParams?: Promise<{ type?: string | string[]; market?: string | string[] }> } = {}) {
  const query = await searchParams;
  const type = types.some(([id]) => id === query?.type) ? query?.type as string : 'all';
  const market = markets.some(([id]) => id === query?.market) ? query?.market as string : 'all';
  const records = listPortfolioRecords('ko').filter(article => article.type !== 'guide' && (market === 'all' || article.marketId === marketIds[market]) && (type === 'all' || (type === 'analysis' ? article.type === 'market-brief' || article.type === 'data-story' : article.type === type)));
  const href = (nextType: string, nextMarket: string) => `/ko/news/?type=${nextType}&market=${nextMarket}`;
  return <KoreanSiteFrame href="/ko/news/"><main className={styles.page}><ResearchPageHeading title="뉴스와 시장 분석" description="정책 변화와 시장 흐름을 살펴보고, 분석에 사용한 자료와 확인 날짜를 함께 읽어보세요." />
    <nav className={styles.links} aria-label="기사 유형">{types.map(([id, label]) => <Link key={id} href={href(id, market)} aria-current={type === id ? 'page' : undefined}>{label}</Link>)}</nav>
    <nav className={styles.links} aria-label="기사 도시">{markets.map(([id, label]) => <Link key={id} href={href(type, id)} aria-current={market === id ? 'page' : undefined}>{label}</Link>)}</nav>
    <section className={styles.group} aria-label="기사 목록">{records.length ? <ul className={styles.list}>{records.map(article => <li key={article.id}><div><small>{article.marketId === 'kr-seoul' ? '서울' : article.marketId === 'sg-singapore' ? '싱가포르' : '두바이'} · {types.find(([id]) => id === article.type)?.[1]}</small><h2>{article.title}</h2><p>{article.deck}</p></div><Link href={article.canonicalHref}>기사 읽기</Link></li>)}</ul> : <p>선택한 조건의 기사가 없습니다. 다른 도시나 기사 유형을 선택해 주세요.</p>}</section>
  </main></KoreanSiteFrame>;
}
