import Link from 'next/link';
import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { ResearchPageHeading } from '@/components/market-ui/research-page-heading';
import { listPortfolioRecords } from '@/content/portfolio-manifest';
import { indexableMetadata } from '@/lib/public-metadata';
import styles from '@/components/tools/tools.module.css';
export const metadata=indexableMetadata({path:'/ko/guides/',title:'서울·싱가포르·두바이 매수 가이드 | signedprice',description:'예산별 실거래 사례, 매입 비용과 계약 전 확인사항을 살펴보세요.',languageAlternates:{en:'/guides/',ko:'/ko/guides/','zh-Hans':'/zh-cn/guides/'},locale:'ko_KR',imagePath:'/og/ko/'});
export default function Page() {
 const guides=listPortfolioRecords('ko').filter(article=>article.type==='guide');
 return <KoreanSiteFrame href="/ko/guides/"><main className={styles.page}><ResearchPageHeading title="매수 가이드" description="예산에 맞는 거래 사례부터 추가 비용, 계약 전 확인사항까지 살펴보세요."/><ul className={styles.list}>{guides.map(article=><li key={article.id}><div><small>{article.marketId==='kr-seoul'?'서울':article.marketId==='sg-singapore'?'싱가포르':'두바이'}</small><h2>{article.title}</h2><p>{article.deck}</p></div><Link href={article.canonicalHref}>가이드 보기</Link></li>)}</ul><nav className={styles.links} aria-label="다른 가이드"><Link href="/guides/">전체 영문 가이드</Link><Link href="/ko/tools/">계산·비교 도구</Link></nav></main></KoreanSiteFrame>;
}
