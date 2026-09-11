import { BudgetSearch } from '@/components/global-shortlist/budget-search';
import { DubaiShell } from '@/components/dubai/dubai-shell';
export const metadata = { title: '迪拜预算搜索与收藏 | signedprice', description: '搜索已公开的迪拜区域价格数据，收藏感兴趣的地区。', alternates: { canonical: 'https://www.signedprice.com/zh-cn/ae/dubai/shortlist/' }, robots: { index: false, follow: true } };
export default function Page() { return <DubaiShell locale="zh-CN" href="/zh-cn/ae/dubai/shortlist/"><BudgetSearch locale="zh-CN" market="dubai" /></DubaiShell>; }
