import {ToolsHub} from '@/components/tools/tools-hub';
import {indexableMetadata} from '@/lib/public-metadata';
export const metadata=indexableMetadata({path:'/tools/',title:'Property calculators and comparison tools | signedprice',description:'Check asking prices, compare rent offers and calculate purchase costs and operating yield.',languageAlternates:{en:'/tools/',ko:'/ko/tools/','zh-Hans':'/zh-cn/tools/'},locale:'en_US'});
export default function Page() {return <ToolsHub locale="en"/>;}
