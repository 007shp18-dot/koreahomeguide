import { BudgetSearch } from '@/components/global-shortlist/budget-search';
import { ToolsShell } from '@/components/tools/tools-shell';
export const metadata = { title: 'Tokyo condominium budget & saved neighbourhoods | SignedPrice', robots: { index: false, follow: true } };
export default function Page() { return <ToolsShell locale="ko" href="/ko/jp/tokyo/shortlist/"><BudgetSearch market="tokyo" locale="ko" embedded /></ToolsShell>; }
