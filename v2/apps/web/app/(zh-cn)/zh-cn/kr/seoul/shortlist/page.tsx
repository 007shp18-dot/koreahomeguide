import { SeoulShortlist } from '@/components/seoul-shortlist/shortlist';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { homepageCopy } from '@/lib/site-copy';
export const metadata = { title:'首尔住宅预算筛选与收藏 | SignedPrice',robots:{index:false,follow:true} };
export default function Page() {
 return <><SiteHeader copy={{...homepageCopy.header,languageLabel:'ZH',homeHref:'/zh-cn/',marketLabel:'首尔',links:[{label:'预算与收藏',href:'/zh-cn/kr/seoul/shortlist/',isCurrent:true}]}}/><SeoulShortlist locale="zh-CN"/><SiteFooter locale="zh-CN" copy={homepageCopy.footer}/></>;
}
