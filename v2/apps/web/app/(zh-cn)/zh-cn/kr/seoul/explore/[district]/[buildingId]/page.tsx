import type { Metadata } from 'next';

import EnglishBuildingRoute, {
  generateMetadata as generateEnglishMetadata,
  listKoreanPrerenderedKoreaBuildingParams,
} from '@/app/(en)/kr/seoul/explore/[district]/[buildingId]/page';

type BuildingPageProps = Readonly<{
  params: Promise<Readonly<{ district: string; buildingId: string }>>;
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export const dynamic = 'force-static';
export const revalidate = 3_600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [...listKoreanPrerenderedKoreaBuildingParams()];
}

export async function generateMetadata(props: BuildingPageProps): Promise<Metadata> {
  return generateEnglishMetadata({ ...props, locale: 'zh-CN' });
}

export default async function ChineseBuildingRoute(props: BuildingPageProps) {
  return EnglishBuildingRoute({ ...props, locale: 'zh-CN' });
}
