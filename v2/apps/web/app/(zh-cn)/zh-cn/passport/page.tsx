import { PassportPage } from '@/components/passport/passport-page';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/zh-cn/passport/', title: '比较首尔、新加坡与迪拜的房产购买力 | signedprice', description: '选择美元、韩元、新加坡元或迪拉姆预算，用已发布成交依据比较首尔、新加坡和迪拜的参考购买力。', languageAlternates: { en: '/passport/', ko: '/ko/passport/', 'zh-Hans': '/zh-cn/passport/' }, locale: 'zh_CN' });
export default function Page() { return <PassportPage locale="zh-CN" />; }
