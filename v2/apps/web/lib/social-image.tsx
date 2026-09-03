import { ImageResponse } from 'next/og';

const size = { width: 1200, height: 630 } as const;

export function signedPriceSocialImage(locale: 'en' | 'ko'): ImageResponse {
  const korean = locale === 'ko';
  return new ImageResponse(
    (
      <div style={{
        alignItems: 'stretch',
        background: '#f4f0e8',
        color: '#181816',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif',
        height: '100%',
        justifyContent: 'space-between',
        padding: '72px 84px',
        width: '100%',
      }}>
        <div style={{ display: 'flex', fontSize: 42, fontWeight: 800 }}>
          signed<span style={{ color: '#f05a28', fontWeight: 500 }}>price</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: korean ? 82 : 76, fontWeight: 800, letterSpacing: '-3px' }}>
            {korean ? '서울 주거 계약 근거' : 'See what homes actually signed for.'}
          </div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 600 }}>
            {korean
              ? '신고 계약의 출처·기간·표본·게시 기준을 함께 확인하세요.'
              : 'Verified Seoul property evidence · Source and limits shown'}
          </div>
        </div>
        <div style={{ background: '#181816', display: 'flex', height: 12, width: '100%' }} />
      </div>
    ),
    {
      ...size,
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    },
  );
}
