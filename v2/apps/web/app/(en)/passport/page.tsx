import { PassportPage } from '@/components/passport/passport-page';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/passport/', title: 'Compare property purchasing power across Seoul, Singapore and Dubai | signedprice', description: 'Enter one KRW budget and compare indicative purchasing power using released transaction evidence for Seoul, Singapore and Dubai.', languageAlternates: { en: '/passport/', ko: '/ko/passport/', 'zh-Hans': '/zh-cn/passport/' }, locale: 'en_US' });
export default function Page() { return <PassportPage locale="en" />; }
