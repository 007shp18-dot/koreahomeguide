import type { Metadata } from 'next';
import { SingaporeCorrectionsPage } from '@/components/trust/singapore-corrections-page';
export const metadata: Metadata = { title: '新加坡数据更正记录 | signedprice', robots: { index: false, follow: true } };
export default function Page() { return <SingaporeCorrectionsPage locale="zh-CN" />; }
