import TokyoExplorer from '@/components/japan/tokyo-explorer';
import {indexableMetadata} from '@/lib/public-metadata';
export const metadata=indexableMetadata({path:'/ko/jp/tokyo/explore/',locale:'ko_KR',title:'도쿄 실거래가 탐색 | SignedPrice',description:'도쿄 주택 실거래를 구, 동네, 분기별로 살펴보세요.'});
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <TokyoExplorer locale="ko" searchParams={searchParams}/>;}
