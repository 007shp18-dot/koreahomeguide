import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { ContactPageContent } from '@/components/operator/contact-page-content';
import { SIGNEDPRICE_PRIVACY_EMAIL } from '@/lib/operator/public-contacts';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({path:'/zh-cn/contact/',title:'购房咨询与联系 | SignedPrice',description:'整理购房预算、意向区域与问题，并通过邮件联系SignedPrice。',locale:'zh_CN'});
export default function Contact(){return <EditorialGrowthPublicFrame locale="zh-CN" surface="home" shell><ContactPageContent locale="zh-CN" privacyContact={SIGNEDPRICE_PRIVACY_EMAIL} /></EditorialGrowthPublicFrame>;}
