import { SeoulOverview } from '@/components/public-market/seoul-overview';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata=indexableMetadata({path:'/zh-cn/kr/seoul/',title:'首尔购房与成交概览 | SignedPrice',description:'比较首尔购房预算、区域与实际成交，并了解购房核查事项。',locale:'zh_CN',languageAlternates:{en:'/kr/seoul/',ko:'/ko/kr/seoul/','zh-Hans':'/zh-cn/kr/seoul/'}});
export default function Page(){return <SeoulOverview locale="zh-CN" />;}
