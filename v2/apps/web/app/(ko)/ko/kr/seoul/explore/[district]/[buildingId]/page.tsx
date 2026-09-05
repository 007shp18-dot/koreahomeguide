import type { Metadata } from 'next';

import EnglishBuildingRoute, {
  generateMetadata as generateEnglishMetadata,
  generateStaticParams as generateEnglishStaticParams,
} from '@/app/(en)/kr/seoul/explore/[district]/[buildingId]/page';

type BuildingPageProps = Readonly<{
  params: Promise<Readonly<{ district: string; buildingId: string }>>;
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export function generateStaticParams() {
  return generateEnglishStaticParams();
}

export async function generateMetadata(props: BuildingPageProps): Promise<Metadata> {
  return generateEnglishMetadata(props);
}

export default async function KoreanBuildingRoute(props: BuildingPageProps) {
  return EnglishBuildingRoute({ ...props, locale: 'ko' });
}
