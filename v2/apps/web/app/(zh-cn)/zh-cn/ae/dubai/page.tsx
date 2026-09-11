import { DubaiShell } from '@/components/dubai/dubai-shell';
import { DubaiOverview } from '@/components/dubai/dubai-overview';
import { indexableMetadata } from '@/lib/locale/chinese-market-metadata';
export const metadata = indexableMetadata({ path: '/zh-cn/ae/dubai/', title: '迪拜区域房价、租金与购房研究 | signedprice', description: '探索现房与期房的区域价格，比较报价并估算购房成本，同时查看数据期间与样本限制。' });
export default function DubaiPage() { return <DubaiShell locale="zh-CN" href="/zh-cn/ae/dubai/"><DubaiOverview locale="zh-CN" /></DubaiShell>; }
