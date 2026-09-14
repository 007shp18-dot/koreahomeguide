import { notFound } from 'next/navigation';
import {
  renderPropertyReviewDetailWithPrice,
  namedPropertyMetadata,
  namedPropertyProfile,
  namedPropertyStaticParams,
  type NamedPropertyPageProps,
} from '@/components/market-ui/property-review-detail-page';

export const dynamicParams = false;

export function generateStaticParams() {
  return namedPropertyStaticParams('jp-tokyo');
}

export async function generateMetadata({ params }: NamedPropertyPageProps) {
  return namedPropertyMetadata('en', 'jp-tokyo', (await params).profileId);
}

export default async function PropertyDetailPage({ params }: NamedPropertyPageProps) {
  const profile = namedPropertyProfile('jp-tokyo', (await params).profileId);
  if (!profile) notFound();
  return renderPropertyReviewDetailWithPrice({ profile, locale: 'en' });
}
