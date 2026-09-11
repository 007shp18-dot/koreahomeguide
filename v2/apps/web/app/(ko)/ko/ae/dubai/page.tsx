import { DubaiOverview } from '@/components/dubai/dubai-overview';
import { DubaiShell } from '@/components/dubai/dubai-shell';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({ path: '/ko/ae/dubai/', title: '두바이 부동산 시장 개요 | SignedPrice', description: '두바이 준공·분양 단계의 지역별 가격과 임대료 비교 기준을 한국어로 확인하세요.', locale: 'ko_KR', languageAlternates: { en: '/ae/dubai/', ko: '/ko/ae/dubai/' } });
export default function Page() {
  return <DubaiShell locale="ko" href="/ko/ae/dubai/"><DubaiOverview locale="ko" /></DubaiShell>;
}
