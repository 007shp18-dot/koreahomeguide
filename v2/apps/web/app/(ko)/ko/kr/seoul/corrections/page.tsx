import type { Metadata } from 'next';
import { SeoulCorrectionsPage } from '@/components/trust/seoul-corrections-page';

export const metadata: Metadata = {
  title: '서울 데이터 정정 이력 | signedprice', description: '서울 부동산 자료와 설명의 공개 정정 이력입니다.',
  robots: { index: false, follow: true },
};

export default function Page() { return <SeoulCorrectionsPage locale="ko" />; }
