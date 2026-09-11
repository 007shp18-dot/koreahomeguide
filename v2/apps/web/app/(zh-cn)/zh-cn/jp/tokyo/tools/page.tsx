import { BudgetSearch } from '@/components/global-shortlist/budget-search';
import { ToolsShell } from '@/components/tools/tools-shell';
export const metadata = { title: '东京住宅预算工具 | SignedPrice', robots: { index: false, follow: true } };
export default function Page() { return <ToolsShell locale="zh-CN" href="/zh-cn/jp/tokyo/tools/"><BudgetSearch market="tokyo" locale="zh-CN" embedded /></ToolsShell>; }
