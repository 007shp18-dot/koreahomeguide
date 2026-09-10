import TokyoExplorer from '@/components/japan/tokyo-explorer';
import {indexableMetadata} from '@/lib/public-metadata';
export const metadata=indexableMetadata({path:'/ko/jp/tokyo/explore/',title:'도쿄 실거래가 탐색 | SignedPrice',description:'Official Tokyo housing transactions by ward, neighbourhood and quarter.'});
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <TokyoExplorer locale="ko" searchParams={searchParams}/>;}
