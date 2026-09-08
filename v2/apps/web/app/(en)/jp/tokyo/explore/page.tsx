import { indexableMetadata } from '@/lib/public-metadata';
import TokyoExplorer from '@/components/japan/tokyo-explorer';

export const metadata = indexableMetadata({
  path: '/jp/tokyo/explore/',
  title: 'Explore Tokyo recorded property prices | SignedPrice',
  description: 'Search official Tokyo transactions by ward, neighbourhood, floor area and quarter, with prices in JPY.',
});

export default TokyoExplorer;
