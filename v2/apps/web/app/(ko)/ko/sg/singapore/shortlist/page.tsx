import { BudgetSearch } from '@/components/global-shortlist/budget-search';
import { SingaporePage } from '@/components/singapore/singapore-shell';
import { singaporeMetadata } from '@/lib/locale/singapore-copy';
export const metadata = singaporeMetadata({ title: '싱가포르 예산 검색 및 저장한 장소 | signedprice', description: '공개된 싱가포르 가격 자료를 검색하고 다시 볼 장소를 저장하세요.', alternates: { canonical: 'https://www.signedprice.com/ko/sg/singapore/shortlist/' }, robots: { index: false, follow: true } });
export default function Page() { return <SingaporePage locale="ko" currentHref="/ko/sg/singapore/shortlist/" unframed><BudgetSearch locale="ko" market="singapore" embedded /></SingaporePage>; }
