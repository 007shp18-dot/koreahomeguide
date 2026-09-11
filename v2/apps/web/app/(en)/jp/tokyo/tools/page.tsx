import { BudgetSearch } from '@/components/global-shortlist/budget-search';
import { ToolsShell } from '@/components/tools/tools-shell';
export const metadata = { title: 'Tokyo condominium budget tool | SignedPrice', robots: { index: false, follow: true } };
export default function Page() { return <ToolsShell locale="en" href="/jp/tokyo/tools/"><BudgetSearch market="tokyo" locale="en" embedded /></ToolsShell>; }
