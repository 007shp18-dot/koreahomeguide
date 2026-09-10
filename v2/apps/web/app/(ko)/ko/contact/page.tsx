import { KoreanSiteFrame } from '@/components/korean-site-frame';
import { ContactPageContent } from '@/components/operator/contact-page-content';
import { operatorProfileFromEnvironment } from '@/lib/operator/operator-profile.server';
import { SIGNEDPRICE_PRIVACY_EMAIL } from '@/lib/operator/public-contacts';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata = indexableMetadata({ path: '/ko/contact/', title: '문의하기 | SignedPrice', description: '사이트 이용, 거래 정보, 제휴 또는 데이터 정정에 관해 SignedPrice에 문의하세요.', locale: 'ko_KR', languageAlternates: { en: '/contact/', ko: '/ko/contact/' } });
export default function KoreanContact() {
  const profile = operatorProfileFromEnvironment();
  return <KoreanSiteFrame href="/ko/contact/"><ContactPageContent locale="ko" privacyContact={profile.status === 'ready' ? profile.privacyContact : SIGNEDPRICE_PRIVACY_EMAIL} /></KoreanSiteFrame>;
}
