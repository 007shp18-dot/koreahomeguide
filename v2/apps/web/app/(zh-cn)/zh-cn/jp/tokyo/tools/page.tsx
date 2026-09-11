import { TokyoPriceCheck } from '@/components/japan/tokyo-price-check';
import type { TokyoCheckParams } from '@/lib/japan/price-check';
export const metadata = { title: '核对东京报价 | SignedPrice', robots: { index: false, follow: true } };
export default function Page({ searchParams }: { searchParams: Promise<TokyoCheckParams> }) {
  return <TokyoPriceCheck locale="zh-CN" searchParams={searchParams} />;
}
