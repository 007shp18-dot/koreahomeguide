import type { Metadata } from 'next';
import { SingaporeCorrectionsPage } from '@/components/trust/singapore-corrections-page';
export const metadata: Metadata = { title: 'Singapore data corrections | signedprice', robots: { index: false, follow: true } };
export default function Page() { return <SingaporeCorrectionsPage locale="en" />; }
