import { TokyoPriceCheck } from '@/components/japan/tokyo-price-check';
import type { TokyoCheckParams } from '@/lib/japan/price-check';
export const metadata = { title: 'Check a Tokyo asking price | SignedPrice', robots: { index: false, follow: true } };
export default function Page({ searchParams }: { searchParams: Promise<TokyoCheckParams> }) {
  return <TokyoPriceCheck locale="en" searchParams={searchParams} />;
}
