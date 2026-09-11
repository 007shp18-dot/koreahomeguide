import { PricesPage } from '@/components/prices-page';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/prices/', title: 'Explore property prices by city | SignedPrice', description: 'Search recorded property prices and rents by city.', locale: 'en_US', languageAlternates: { en: '/prices/', ko: '/ko/prices/', 'zh-Hans': '/zh-cn/prices/' } });

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <PricesPage locale="en" searchParams={searchParams} />;
}
