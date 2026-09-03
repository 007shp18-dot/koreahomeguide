import type { Metadata } from 'next';

import EnglishBuildingRoute, {
  generateMetadata as generateEnglishMetadata,
  generateStaticParams as generateEnglishStaticParams,
} from '@/app/(en)/kr/seoul/explore/[district]/[buildingId]/page';

type BuildingPageProps = Readonly<{
  params: Promise<Readonly<{ district: string; buildingId: string }>>;
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export const dynamicParams = true;

export function generateStaticParams() {
  return generateEnglishStaticParams();
}

/**
 * Korean building routes stay out of the index while this locale has no
 * canonical of its own: the English route owns the canonical for a building,
 * and delegating metadata without saying so would publish a Korean URL that
 * points its canonical at the English one by accident rather than by decision.
 */
export async function generateMetadata(props: BuildingPageProps): Promise<Metadata> {
  return generateEnglishMetadata({ ...props, locale: 'ko' });
}

export default async function KoreanBuildingRoute(props: BuildingPageProps) {
  return EnglishBuildingRoute({ ...props, locale: 'ko' });
}
