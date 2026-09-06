import { DubaiShell } from '@/components/dubai/dubai-shell';
import { DubaiOverview } from '@/components/dubai/dubai-overview';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({ path: '/ae/dubai/', title: 'Dubai property market research | signedprice', description: 'Official Dubai market releases, area research and a practical purchase-cost workflow, with sources and dates.' });
export default function DubaiPage() { return <DubaiShell href="/ae/dubai/"><DubaiOverview /></DubaiShell>; }
