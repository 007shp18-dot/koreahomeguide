import type { Metadata } from 'next';
import { SingaporeCorrectionsPage } from '@/components/trust/singapore-corrections-page';
export const metadata: Metadata = { title: '싱가포르 데이터 정정 이력 | signedprice', robots: { index: false, follow: true } };
export default function Page() { return <SingaporeCorrectionsPage locale="ko" />; }
