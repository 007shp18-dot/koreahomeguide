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
  return namedPropertyStaticParams('jp-tokyo');
}

export async function generateMetadata({ params }: NamedPropertyPageProps) {
  return namedPropertyMetadata('zh-CN', 'jp-tokyo', (await params).profileId);
}

export default async function PropertyDetailPage({ params }: NamedPropertyPageProps) {
  const profile = namedPropertyProfile('jp-tokyo', (await params).profileId);
  if (!profile) notFound();
  return <PropertyReviewDetailPage profile={profile} locale="zh-CN" />;
}
