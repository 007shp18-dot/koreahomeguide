import { notFound } from 'next/navigation';
import { EditorialGrowthPublicFrame } from '@/components/editorial-growth/editorial-growth-public-shell';
import { RegionalResource } from '@/components/guide/regional-resource';
import { REGIONAL_RESOURCES, RESOURCE_LABELS, isResourceRoute, regionalResourceHref, resourceParams, type GuideResource } from '@/content/regional-guide-resources';
import { indexableMetadata } from '@/lib/public-metadata';

type Props = { params: Promise<{ slug: string; resource: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return resourceParams(); }
export async function generateMetadata({ params }: Props) {
  const { slug, resource } = await params;
  if (!isResourceRoute(slug, resource)) notFound();
  const kind = resource as GuideResource;
  return indexableMetadata({ path: regionalResourceHref(slug, kind), title: `${REGIONAL_RESOURCES[slug].name.en} ${RESOURCE_LABELS[kind].en} | SignedPrice`, description: REGIONAL_RESOURCES[slug].intro.en, languageAlternates: { en: regionalResourceHref(slug, kind), ko: regionalResourceHref(slug, kind, 'ko') } });
}
export default async function Page({ params }: Props) {
  const { slug, resource } = await params;
  if (!isResourceRoute(slug, resource)) notFound();
  const kind = resource as GuideResource;
  return <EditorialGrowthPublicFrame locale="en" surface="content" activeSection="guides" currentHref={regionalResourceHref(slug, kind)}><RegionalResource city={slug} resource={kind} locale="en" /></EditorialGrowthPublicFrame>;
}
