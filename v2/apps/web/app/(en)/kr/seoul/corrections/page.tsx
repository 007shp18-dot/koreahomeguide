import type { Metadata } from 'next';
import { SeoulCorrectionsPage } from '@/components/trust/seoul-corrections-page';

export const metadata: Metadata = {
  title: 'Seoul data corrections | signedprice', description: 'Published corrections to Seoul property data and explanations.',
  robots: { index: false, follow: true },
};

export default function Page() { return <SeoulCorrectionsPage locale="en" />; }
