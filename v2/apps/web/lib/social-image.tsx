import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const size = { width: 1200, height: 630 } as const;

export async function signedPriceSocialImage(locale: 'en' | 'ko'): Promise<ImageResponse> {
  const korean = locale === 'ko';
  const koreanFont = korean
    ? await readFile(join(process.cwd(), 'app/fonts/social/signedprice-social-ko.ttf'))
    : undefined;
  return new ImageResponse(
    (
      <div style={{
        alignItems: 'stretch',
        background: '#f4f0e8',
        color: '#181816',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: korean ? 'SignedPrice Social' : 'Arial, sans-serif',
        height: '100%',
        justifyContent: 'space-between',
        padding: '72px 84px',
        width: '100%',
      }}>
        <div style={{ display: 'flex', fontSize: 42, fontWeight: 800 }}>
          signed<span style={{ color: '#f05a28', fontWeight: 500 }}>price</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: korean ? 72 : 76, fontWeight: 800, letterSpacing: korean ? '0px' : '-3px' }}>
            {korean ? '실거래가로 비교하는 집값' : 'See what homes actually signed for.'}
          </div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 600 }}>
            {korean
              ? '서울·싱가포르·두바이 거래 내역과 출처를 확인하세요.'
              : 'Verified Seoul property evidence · Source and limits shown'}
          </div>
        </div>
        <div style={{ background: '#181816', display: 'flex', height: 12, width: '100%' }} />
      </div>
    ),
    {
      ...size,
      ...(koreanFont ? { fonts: [{ name: 'SignedPrice Social', data: koreanFont, weight: 700 as const, style: 'normal' as const }] } : {}),
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    },
  );
}
