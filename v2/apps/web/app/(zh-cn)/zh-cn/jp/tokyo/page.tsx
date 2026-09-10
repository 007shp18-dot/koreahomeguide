import TokyoOverview from '@/components/japan/tokyo-overview';
import {indexableMetadata} from '@/lib/public-metadata';
export const metadata=indexableMetadata({path:'/zh-cn/jp/tokyo/',title:'Tokyo property prices and neighbourhoods | SignedPrice',description:'Official Tokyo housing transactions by ward and neighbourhood.'});
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <TokyoOverview locale="zh-CN" searchParams={searchParams}/>;}
