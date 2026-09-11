import { BudgetSearch } from '@/components/global-shortlist/budget-search';
import { ToolsShell } from '@/components/tools/tools-shell';
export const metadata = { title: '도쿄 주택 예산 도구 | SignedPrice', robots: { index: false, follow: true } };
export default function Page() { return <ToolsShell locale="ko" href="/ko/jp/tokyo/tools/"><BudgetSearch market="tokyo" locale="ko" embedded /></ToolsShell>; }
