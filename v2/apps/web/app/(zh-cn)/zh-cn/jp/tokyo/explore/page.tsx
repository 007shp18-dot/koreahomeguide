import TokyoExplorer from '@/components/japan/tokyo-explorer';
import {indexableMetadata} from '@/lib/public-metadata';
export const metadata=indexableMetadata({path:'/zh-cn/jp/tokyo/explore/',locale:'zh_CN',title:'东京成交价格探索 | SignedPrice',description:'按区、街区和季度探索东京住宅成交记录。'});
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <TokyoExplorer locale="zh-CN" searchParams={searchParams}/>;}
