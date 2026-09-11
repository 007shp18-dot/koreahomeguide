import { DubaiShell } from '@/components/dubai/dubai-shell';
import { DubaiGuide } from '@/components/dubai/dubai-guide';
import { indexableMetadata } from '@/lib/locale/chinese-market-metadata';
export const metadata = indexableMetadata({ path: '/zh-cn/ae/dubai/guide/', title: '迪拜购房研究 | signedprice', description: '按步骤核查迪拜房产身份、项目进展、持续费用和购房成本，并使用迪拉姆情景计算器。' });
export default function DubaiGuidePage() { return <DubaiShell locale="zh-CN" href="/zh-cn/ae/dubai/guide/"><DubaiGuide locale="zh-CN" /></DubaiShell>; }
