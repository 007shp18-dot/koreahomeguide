import type { Metadata } from 'next';
import TokyoExplorer from '@/components/japan/tokyo-explorer';

export const metadata: Metadata = {
  title: 'Explore Tokyo recorded property prices | SignedPrice',
  description: 'Search official Tokyo transactions by ward, neighbourhood, floor area and quarter, with prices in JPY.',
  alternates: { canonical: '/jp/tokyo/explore/' },
  robots: { index: true, follow: true },
};

export default TokyoExplorer;
