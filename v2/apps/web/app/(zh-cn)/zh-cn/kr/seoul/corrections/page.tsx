import type { Metadata } from 'next';
import { SeoulCorrectionsPage } from '@/components/trust/seoul-corrections-page';

export const metadata: Metadata = {
  title: '首尔数据更正记录 | signedprice', description: '首尔房地产数据及说明的公开更正记录。',
  robots: { index: false, follow: true },
};

export default function Page() { return <SeoulCorrectionsPage locale="zh-CN" />; }
