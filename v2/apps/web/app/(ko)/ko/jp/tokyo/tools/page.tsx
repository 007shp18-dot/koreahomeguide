import { TokyoPriceCheck } from '@/components/japan/tokyo-price-check';
import type { TokyoCheckParams } from '@/lib/japan/price-check';
export const metadata = { title: '도쿄 매물 가격 비교 | SignedPrice', robots: { index: false, follow: true } };
export default function Page({ searchParams }: { searchParams: Promise<TokyoCheckParams> }) {
  return <TokyoPriceCheck locale="ko" searchParams={searchParams} />;
}
