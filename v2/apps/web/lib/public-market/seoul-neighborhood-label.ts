import { neighborhoodDisplayName } from './seoul-display-names';
import { getSeoulDistrictBySlug } from '@signedprice/korea-rent/browser';

/** Display/search aliases only. Never use these names for identity or geocoding.
 * Reviewed references: docs/operations/2026-09-07-explore-location-labels.md.
 * Unreviewed neighborhoods retain their source name.
 */
const ENGLISH_NAMES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'gangnam-gu': {
    '압구정동': 'Apgujeong-dong', '청담동': 'Cheongdam-dong', '대치동': 'Daechi-dong',
    '도곡동': 'Dogok-dong', '개포동': 'Gaepo-dong', '일원동': 'Irwon-dong',
    '논현동': 'Nonhyeon-dong', '삼성동': 'Samseong-dong', '세곡동': 'Segok-dong',
    '신사동': 'Sinsa-dong', '수서동': 'Suseo-dong', '역삼동': 'Yeoksam-dong',
  },
  'dobong-gu': {
    '도봉동': 'Dobong-dong', '방학동': 'Banghak-dong', '쌍문동': 'Ssangmun-dong', '창동': 'Chang-dong',
  },
  'dongjak-gu': {
    '노량진동': 'Noryangjin-dong', '신대방동': 'Sindaebang-dong', '사당동': 'Sadang-dong',
    '대방동': 'Daebang-dong', '상도1동': 'Sangdo 1-dong', '상도동': 'Sangdo-dong',
  },
};

export function seoulNeighborhoodLabel(districtSlug: string, name: string, locale: 'en' | 'ko' | 'zh-CN'): string {
  if (!getSeoulDistrictBySlug(districtSlug)) return name;
  const alias = ENGLISH_NAMES[districtSlug]?.[name.trim()];
  return locale === 'en' && typeof alias === 'string' ? `${alias} · ${name}` : neighborhoodDisplayName(name, locale);
}

export function matchesSeoulNeighborhoodQuery(districtSlug: string, name: string, query: string): boolean {
  const alias = seoulNeighborhoodLabel(districtSlug, name, 'en');
  const normalize = (value: string) => value.toLowerCase().replace(/[\s-]+/g, '');
  const normalized = normalize(query);
  return normalized.length > 0 && normalize(alias).includes(normalized);
}
