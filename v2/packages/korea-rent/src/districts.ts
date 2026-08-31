export const SEOUL_RENT_CHECK_DISTRICTS = [
  { lawdCd: '11110', slug: 'jongno-gu', nameEn: 'Jongno-gu', nameKo: '종로구' },
  { lawdCd: '11140', slug: 'jung-gu', nameEn: 'Jung-gu', nameKo: '중구' },
  { lawdCd: '11170', slug: 'yongsan-gu', nameEn: 'Yongsan-gu', nameKo: '용산구' },
  { lawdCd: '11200', slug: 'seongdong-gu', nameEn: 'Seongdong-gu', nameKo: '성동구' },
  { lawdCd: '11215', slug: 'gwangjin-gu', nameEn: 'Gwangjin-gu', nameKo: '광진구' },
  { lawdCd: '11230', slug: 'dongdaemun-gu', nameEn: 'Dongdaemun-gu', nameKo: '동대문구' },
  { lawdCd: '11260', slug: 'jungnang-gu', nameEn: 'Jungnang-gu', nameKo: '중랑구' },
  { lawdCd: '11290', slug: 'seongbuk-gu', nameEn: 'Seongbuk-gu', nameKo: '성북구' },
  { lawdCd: '11305', slug: 'gangbuk-gu', nameEn: 'Gangbuk-gu', nameKo: '강북구' },
  { lawdCd: '11320', slug: 'dobong-gu', nameEn: 'Dobong-gu', nameKo: '도봉구' },
  { lawdCd: '11350', slug: 'nowon-gu', nameEn: 'Nowon-gu', nameKo: '노원구' },
  { lawdCd: '11380', slug: 'eunpyeong-gu', nameEn: 'Eunpyeong-gu', nameKo: '은평구' },
  { lawdCd: '11410', slug: 'seodaemun-gu', nameEn: 'Seodaemun-gu', nameKo: '서대문구' },
  { lawdCd: '11440', slug: 'mapo-gu', nameEn: 'Mapo-gu', nameKo: '마포구' },
  { lawdCd: '11470', slug: 'yangcheon-gu', nameEn: 'Yangcheon-gu', nameKo: '양천구' },
  { lawdCd: '11500', slug: 'gangseo-gu', nameEn: 'Gangseo-gu', nameKo: '강서구' },
  { lawdCd: '11530', slug: 'guro-gu', nameEn: 'Guro-gu', nameKo: '구로구' },
  { lawdCd: '11545', slug: 'geumcheon-gu', nameEn: 'Geumcheon-gu', nameKo: '금천구' },
  { lawdCd: '11560', slug: 'yeongdeungpo-gu', nameEn: 'Yeongdeungpo-gu', nameKo: '영등포구' },
  { lawdCd: '11590', slug: 'dongjak-gu', nameEn: 'Dongjak-gu', nameKo: '동작구' },
  { lawdCd: '11620', slug: 'gwanak-gu', nameEn: 'Gwanak-gu', nameKo: '관악구' },
  { lawdCd: '11650', slug: 'seocho-gu', nameEn: 'Seocho-gu', nameKo: '서초구' },
  { lawdCd: '11680', slug: 'gangnam-gu', nameEn: 'Gangnam-gu', nameKo: '강남구' },
  { lawdCd: '11710', slug: 'songpa-gu', nameEn: 'Songpa-gu', nameKo: '송파구' },
  { lawdCd: '11740', slug: 'gangdong-gu', nameEn: 'Gangdong-gu', nameKo: '강동구' },
] as const;

export type SeoulRentCheckDistrict = (typeof SEOUL_RENT_CHECK_DISTRICTS)[number];
export type SeoulLawdCd = SeoulRentCheckDistrict['lawdCd'];
export type SeoulDistrictSlug = SeoulRentCheckDistrict['slug'];

export function getSeoulDistrictBySlug(slug: string): SeoulRentCheckDistrict | null {
  return SEOUL_RENT_CHECK_DISTRICTS.find((district) => district.slug === slug) ?? null;
}
