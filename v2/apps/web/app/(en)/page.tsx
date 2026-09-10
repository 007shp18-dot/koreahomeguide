import type { Metadata } from 'next';
import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { PropertyHome } from '@/components/design-review/editorial-growth-home';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/',
  title: 'Explore property prices in Seoul, Singapore, Dubai & Tokyo | SignedPrice',
  description: 'Explore homes and neighbourhoods through recorded property prices. Compare areas, check offers and plan your purchase in Seoul, Singapore, Dubai and Tokyo.',
  languageAlternates: { en: '/', ko: '/ko/', 'zh-Hans': '/zh-cn/kr/seoul/' },
});
export default function Home() {
  return <EditorialGrowthPublicFrame locale="en" surface="home" shell><PropertyHome locale="en" /></EditorialGrowthPublicFrame>;
}
