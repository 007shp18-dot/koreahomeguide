import { permanentRedirect } from 'next/navigation';
import { actualDetailHref } from '@/lib/research/property-review-locations';
export const metadata = { robots: { index: false, follow: true } };
export default async function Page({ searchParams }: { searchParams: Promise<{market?:string;profile?:string}> }) {
  const query = await searchParams;
  const detail = query.profile ? actualDetailHref('ko', query.profile) : null;
  if (detail) permanentRedirect(`${detail}#property-review`);
  const city = ({'kr-seoul':'/kr/seoul/explore/','sg-singapore':'/sg/singapore/explore/','ae-dubai':'/ae/dubai/explore/','jp-tokyo':'/jp/tokyo/explore/'} as Record<string,string>)[query.market ?? ''];
  permanentRedirect('/ko' + (city ?? '/prices/'));
}
