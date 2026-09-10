import { PassportPage } from '@/components/passport/passport-page';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/passport/', title: 'Compare property purchasing power across Seoul, Singapore, Dubai and Tokyo | signedprice', description: 'Choose USD, KRW, SGD, AED or JPY and compare indicative purchasing power using released transaction evidence for Seoul, Singapore, Dubai and Tokyo.', languageAlternates: { en: '/passport/', ko: '/ko/passport/', 'zh-Hans': '/zh-cn/passport/' }, locale: 'en_US' });
export default function Page() { return <PassportPage locale="en" />; }
