import {ToolsShell} from '@/components/tools/tools-shell';
import {ResearchPageHeading} from '@/components/market-ui/research-page-heading';
import {SavedCities} from '@/components/global-shortlist/saved-cities';
export const metadata = {title:'관심 목록 | SignedPrice', robots:{index:false,follow:true}};
export default function Page() {return <ToolsShell locale="ko" href="/ko/saved/"><ResearchPageHeading title="관심 목록" description="저장한 건물로 돌아가 최신 거래를 확인하세요. 서울·싱가포르·두바이를 지원합니다."/><SavedCities locale="ko" initiallyOpen /></ToolsShell>;}
