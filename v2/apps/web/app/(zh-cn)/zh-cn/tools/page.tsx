import {ToolsHub} from '@/components/tools/tools-hub';
import {indexableMetadata} from '@/lib/public-metadata';
export const metadata=indexableMetadata({path:'/zh-cn/tools/',title:'房地产计算与比较工具 | signedprice',description:'核对报价、比较租赁条件，并用自己的假设计算购置成本与运营收益率。',locale:'zh_CN',languageAlternates:{en:'/tools/',ko:'/ko/tools/','zh-Hans':'/zh-cn/tools/'}});
export default function Page(){return <ToolsHub locale="zh-CN"/>;}
