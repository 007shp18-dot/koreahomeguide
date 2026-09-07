import { BudgetSearch } from '@/components/global-shortlist/budget-search';
import { DubaiShell } from '@/components/dubai/dubai-shell';
export const metadata = { title: 'Dubai budget search & saved places | signedprice', description: 'Search released Dubai area price evidence and save areas to revisit.', alternates: { canonical: 'https://www.signedprice.com/ae/dubai/shortlist/' }, robots: { index: false, follow: true } };
export default function Page() { return <DubaiShell href="/ae/dubai/shortlist/"><BudgetSearch market="dubai" /></DubaiShell>; }
