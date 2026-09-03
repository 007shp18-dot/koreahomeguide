import { Noto_Sans_KR } from 'next/font/google';

export const notoSansKr = Noto_Sans_KR({
  display: 'swap',
  preload: false,
  variable: '--font-noto-sans-kr',
  weight: ['400', '500', '600', '700', '800'],
});
