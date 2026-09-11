import { BudgetSearch } from '@/components/global-shortlist/budget-search';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { homepageCopy } from '@/lib/site-copy';
export const metadata = { title: '新加坡预算搜索与收藏 | signedprice', description: '搜索已公开的新加坡成交价格数据，收藏感兴趣的地区和项目。', alternates: { canonical: 'https://www.signedprice.com/zh-cn/sg/singapore/shortlist/' }, robots: { index: false, follow: true } };
export default function Page() { return <><SiteHeader copy={{ ...homepageCopy.header, marketLabel: '新加坡', languageLabel: 'ZH', homeHref: '/zh-cn/', links: [{ label: '预算与收藏', href: '/zh-cn/sg/singapore/shortlist/', isCurrent: true }] }} /><BudgetSearch locale="zh-CN" market="singapore" /><SiteFooter locale="zh-CN" copy={homepageCopy.footer} /></>; }
