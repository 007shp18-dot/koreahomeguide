import { PassportPage } from '@/components/passport/passport-page';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/zh-cn/passport/', title: '比较首尔、新加坡与迪拜的房产购买力 | signedprice', description: '输入一笔韩元预算，用已发布成交依据比较首尔、新加坡和迪拜的参考购买力。', languageAlternates: { en: '/passport/', ko: '/ko/passport/', 'zh-Hans': '/zh-cn/passport/' }, locale: 'zh_CN' });
export default function Page() { return <PassportPage locale="zh-CN" />; }
