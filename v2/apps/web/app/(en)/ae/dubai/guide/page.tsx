import { DubaiShell } from '@/components/dubai/dubai-shell';
import { DubaiGuide } from '@/components/dubai/dubai-guide';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({ path: '/ae/dubai/guide/', title: 'Research a Dubai property purchase | signedprice', description: 'A practical sequence for checking Dubai property identity, project progress, recurring charges and purchase costs, with an AED scenario calculator.' });
export default function DubaiGuidePage() { return <DubaiShell href="/ae/dubai/guide/"><DubaiGuide /></DubaiShell>; }
