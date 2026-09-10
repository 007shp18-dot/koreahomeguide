import TokyoExplorer from '@/components/japan/tokyo-explorer';
import {indexableMetadata} from '@/lib/public-metadata';
export const metadata=indexableMetadata({path:'/zh-cn/jp/tokyo/explore/',title:'东京成交价格探索 | SignedPrice',description:'Official Tokyo housing transactions by ward, neighbourhood and quarter.'});
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <TokyoExplorer locale="zh-CN" searchParams={searchParams}/>;}
