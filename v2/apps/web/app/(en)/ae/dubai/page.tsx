import { DubaiShell } from '@/components/dubai/dubai-shell';
import { DubaiOverview } from '@/components/dubai/dubai-overview';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({ path: '/ae/dubai/', title: 'Dubai area prices, rents and purchase research | signedprice', description: 'Explore Ready and Off-Plan area prices, compare asking prices, and model purchase costs with source periods and sample limits shown.' });
export default function DubaiPage() { return <DubaiShell href="/ae/dubai/"><DubaiOverview /></DubaiShell>; }
