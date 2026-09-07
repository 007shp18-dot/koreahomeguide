import { BudgetSearch } from '@/components/global-shortlist/budget-search';
import { DubaiShell } from '@/components/dubai/dubai-shell';
export const metadata = { title: '두바이 예산 검색과 관심 지역 | signedprice', description: '공개 거래자료에서 예산에 맞는 두바이 지역을 찾고 관심 목록에 저장하세요.', alternates: { canonical: 'https://www.signedprice.com/ko/ae/dubai/shortlist/' }, robots: { index: false, follow: true } };
export default function Page() { return <DubaiShell locale="ko" href="/ko/ae/dubai/shortlist/"><BudgetSearch locale="ko" market="dubai" /></DubaiShell>; }
