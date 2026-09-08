import Link from 'next/link';
import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { ResearchPageHeading } from '@/components/market-ui/research-page-heading';
import { listPortfolioRecords } from '@/content/portfolio-manifest';
import { indexableMetadata } from '@/lib/public-metadata';
import styles from '@/components/tools/tools.module.css';

export const metadata = indexableMetadata({ path: '/ko/news/', title: '부동산 뉴스와 시장 분석 | signedprice', description: '서울·싱가포르·두바이의 정책 소식과 시장 보고서, 데이터 분석을 출처와 함께 확인하세요.', languageAlternates: { en: '/news/', ko: '/ko/news/', 'zh-Hans': '/zh-cn/news/' }, locale: 'ko_KR', imagePath: '/og/ko/' });
const types = [['insights', '인사이트'], ['news', '뉴스'], ['policy', '정책']] as const;
const insightTypes = [['insights', '전체 인사이트'], ['market', '시장 분석'], ['data-stories', '데이터 스토리']] as const;
const markets = [['all', '모든 도시'], ['seoul', '서울'], ['singapore', '싱가포르'], ['dubai', '두바이']] as const;
const marketIds: Record<string, string> = { seoul: 'kr-seoul', singapore: 'sg-singapore', dubai: 'ae-dubai' };
const insight = (type: string) => ['insights', 'market', 'data-stories'].includes(type);

export default async function Page({ searchParams }: { searchParams?: Promise<{ type?: string | string[]; market?: string | string[] }> } = {}) {
  const query = await searchParams;
  const requested = typeof query?.type === 'string' ? query.type : 'insights';
  const type = [...types, ...insightTypes].some(([id]) => id === requested) ? requested : 'insights';
  const market = markets.some(([id]) => id === query?.market) ? query?.market as string : 'all';
  const records = listPortfolioRecords('ko').filter(article => article.type !== 'guide'
    && (market === 'all' || article.marketId === marketIds[market])
    && (type === 'insights' ? article.type === 'market-brief' || article.type === 'data-story'
      : type === 'market' ? article.type === 'market-brief'
        : type === 'data-stories' ? article.type === 'data-story'
          : type === 'news' ? article.type === 'news-brief'
            : article.type === 'policy-update'));
  const href = (nextType: string, nextMarket: string) => {
    const params = new URLSearchParams();
    if (nextType !== 'insights') params.set('type', nextType);
    if (nextMarket !== 'all') params.set('market', nextMarket);
    return params.size ? `/ko/news/?${params}` : '/ko/news/';
  };
  return <KoreanSiteFrame href="/ko/news/"><main className={styles.page}><ResearchPageHeading title="뉴스와 인사이트" description="정책 변화와 시장 흐름을 살펴보고, 분석에 사용한 자료와 확인 날짜를 함께 읽어보세요." />
    <nav className={styles.links} aria-label="뉴스와 인사이트 유형">{types.map(([id, label]) => <Link key={id} href={href(id, market)} aria-current={id === 'insights' ? insight(type) ? 'page' : undefined : type === id ? 'page' : undefined}>{label}</Link>)}</nav>
    {insight(type) ? <nav className={styles.links} aria-label="인사이트 유형">{insightTypes.map(([id, label]) => <Link key={id} href={href(id, market)} aria-current={type === id ? 'page' : undefined}>{label}</Link>)}</nav> : null}
    <nav className={styles.links} aria-label="기사 도시">{markets.map(([id, label]) => <Link key={id} href={href(type, id)} aria-current={market === id ? 'page' : undefined}>{label}</Link>)}</nav>
    <section className={styles.group} aria-label="기사 목록">{records.length ? <ul className={styles.list}>{records.map(article => <li key={article.id}><div><small>{article.marketId === 'kr-seoul' ? '서울' : article.marketId === 'sg-singapore' ? '싱가포르' : '두바이'} · {article.type === 'market-brief' ? '시장 분석' : article.type === 'data-story' ? '데이터 스토리' : article.type === 'news-brief' ? '뉴스' : '정책'}</small><h2>{article.title}</h2><p>{article.deck}</p></div><Link href={article.canonicalHref} data-editorial-event="article_open">기사 읽기</Link></li>)}</ul> : <p>선택한 조건의 기사가 없습니다. 다른 도시나 기사 유형을 선택해 주세요.</p>}</section>
  </main></KoreanSiteFrame>;
}
