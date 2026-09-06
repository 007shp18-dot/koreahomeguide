import { PassportPage } from '@/components/passport/passport-page';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/ko/passport/', title: '서울·싱가포르·두바이 부동산 구매력 비교 | signedprice', description: '원화 예산 하나로 서울·싱가포르·두바이의 추정 구매력을 공개 실거래 근거와 비교합니다.', languageAlternates: { en: '/passport/', ko: '/ko/passport/', 'zh-Hans': '/zh-cn/passport/' }, locale: 'ko_KR' });
export default function Page() { return <PassportPage locale="ko" />; }
