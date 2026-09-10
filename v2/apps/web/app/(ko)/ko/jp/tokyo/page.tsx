import TokyoOverview from '@/components/japan/tokyo-overview';
import {indexableMetadata} from '@/lib/public-metadata';
export const metadata=indexableMetadata({path:'/ko/jp/tokyo/',locale:'ko_KR',title:'도쿄 주택 가격과 동네 | SignedPrice',description:'일본 정부의 주택 거래 자료를 구와 동네별로 확인하세요.'});
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <TokyoOverview locale="ko" searchParams={searchParams}/>;}
