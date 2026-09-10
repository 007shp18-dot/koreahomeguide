import { notFound, permanentRedirect } from 'next/navigation';

type KoreaCheckPageProps = Readonly<{
  params: Promise<Readonly<{ area: string }>>;
}>;

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ area: 'seoul' }];
}

export default async function KoreaCheckPage({ params }: KoreaCheckPageProps) {
  const { area } = await params;
  if (area !== 'seoul') notFound();
  permanentRedirect('/kr/seoul/tools/rent-check/');
}
