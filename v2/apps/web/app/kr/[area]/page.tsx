import { notFound, redirect } from 'next/navigation';

import { buildKoreaPublicPageMetadata } from '../../../lib/public-market/route-model.server';

type KoreaAreaPageProps = Readonly<{
  params: Promise<Readonly<{ area: string }>>;
}>;

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ area: 'seoul' }];
}

export async function generateMetadata({ params }: KoreaAreaPageProps) {
  const { area } = await params;
  if (area !== 'seoul') notFound();
  return buildKoreaPublicPageMetadata('/kr/seoul/');
}

export default async function KoreaAreaPage({ params }: KoreaAreaPageProps) {
  const { area } = await params;
  if (area !== 'seoul') notFound();
  redirect('/kr/seoul/explore/');
}
