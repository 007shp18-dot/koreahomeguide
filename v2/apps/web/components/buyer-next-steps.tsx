import Link from 'next/link';
import styles from './buyer-next-steps.module.css';

const markets = {
  seoul: { explore: '/kr/seoul/explore/', guide: '/guides/read-seoul-sale-transactions/', scope: 'Match the building, transaction type, floor area and contract period. For rentals, compare the deposit and monthly rent together.' },
  singapore: { explore: '/sg/singapore/explore/', guide: '/guides/read-singapore-private-transactions/', scope: 'Keep private homes and HDB separate. Match the project or block, tenure, floor area and transaction period.' },
  dubai: { explore: '/ae/dubai/explore/', guide: '/ae/dubai/guide/', scope: 'This is an area comparison, not a valuation of your unit. Keep Ready and Off-Plan separate and request property-specific costs and condition details.' },
} as const;

export function BuyerNextSteps({ market, locale = 'en' }: Readonly<{ market: keyof typeof markets; locale?: 'en' | 'ko' }>) {
  const model = markets[market];
  const ko = locale === 'ko';
  return <aside className={styles.next} aria-label={ko ? '비교 후 확인할 사항' : 'After comparing a price'}>
    <h2>{ko ? '가격 비교 다음에는?' : 'What to check next'}</h2>
    <p>{ko ? '같은 건물·거래 유형·면적·계약 기간인지 확인하세요. 임대는 보증금과 월세를 함께 비교하세요.' : model.scope}</p>
    <nav aria-label={ko ? '다음 단계' : 'Next research steps'}>
      <Link href={ko ? '/ko/kr/seoul/explore/' : model.explore}>{ko ? '다른 후보 찾기' : 'Find another candidate'}</Link>
      <Link href={model.guide}>{ko ? '비교 방법 읽기 (영문)' : 'Read the comparison guide'}</Link>
      <Link href={`${ko ? '/ko' : ''}/contact/#research-${market}`}>{ko ? '자료 관련 질문 보내기' : 'Ask a research question'}</Link>
    </nav>
  </aside>;
}
