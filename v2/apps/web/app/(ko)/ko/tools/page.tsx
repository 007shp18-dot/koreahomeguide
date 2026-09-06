import {ToolsHub} from '@/components/tools/tools-hub';
import {indexableMetadata} from '@/lib/public-metadata';
export const metadata=indexableMetadata({path:'/ko/tools/',title:'부동산 계산·비교 도구 | signedprice',description:'가격 확인, 임대 조건 비교와 매입 비용 계산 도구.',languageAlternates:{en:'/tools/',ko:'/ko/tools/','zh-Hans':'/zh-cn/tools/'},locale:'ko_KR',imagePath:'/og/ko/'});
export default function Page() {return <ToolsHub locale="ko"/>;}
