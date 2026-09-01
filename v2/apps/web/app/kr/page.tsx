import { permanentRedirect } from 'next/navigation';

export default async function KoreaHomePage() {
  permanentRedirect('/kr/seoul/check/');
}
