import { notFound } from 'next/navigation';
import {
  PropertyReviewDetailPage,
  namedPropertyMetadata,
  namedPropertyProfile,
  namedPropertyStaticParams,
  type NamedPropertyPageProps,
} from '@/components/market-ui/property-review-detail-page';

export const dynamicParams = false;

export function generateStaticParams() {
  return namedPropertyStaticParams('ae-dubai');
}

export async function generateMetadata({ params }: NamedPropertyPageProps) {
  return namedPropertyMetadata('ko', 'ae-dubai', (await params).profileId);
}

export default async function PropertyDetailPage({ params }: NamedPropertyPageProps) {
  const profile = namedPropertyProfile('ae-dubai', (await params).profileId);
  if (!profile) notFound();
  return <PropertyReviewDetailPage profile={profile} locale="ko" />;
}
