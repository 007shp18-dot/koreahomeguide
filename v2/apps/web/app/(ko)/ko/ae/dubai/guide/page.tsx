import { DubaiShell } from '@/components/dubai/dubai-shell';
import { DubaiGuide } from '@/components/dubai/dubai-guide';
import { indexableMetadata } from '@/lib/public-metadata';
export const metadata = indexableMetadata({ locale: 'ko_KR', imagePath: '/og/ko/', path: '/ko/ae/dubai/guide/', title: '두바이 주택 매수 전 확인할 사항 | signedprice', description: '두바이 주택 매수 전 소유권과 공사 진행 상황, 관리비, 매수 비용을 순서대로 확인하세요. AED 기준 비용 계산기도 제공합니다.' });
export default function DubaiGuidePage() { return <DubaiShell locale="ko" href="/ko/ae/dubai/guide/"><DubaiGuide locale="ko" /></DubaiShell>; }
