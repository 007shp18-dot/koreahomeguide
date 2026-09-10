import TokyoOverview from '@/components/japan/tokyo-overview';
import {indexableMetadata} from '@/lib/public-metadata';
export const metadata=indexableMetadata({path:'/zh-cn/jp/tokyo/',locale:'zh_CN',title:'东京住宅价格与街区 | SignedPrice',description:'按区和街区查看日本政府公布的住宅成交资料。'});
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <TokyoOverview locale="zh-CN" searchParams={searchParams}/>;}
