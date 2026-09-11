import type { ProductLocale } from '../locale/product-copy';
import { localizedSeoulHref } from '../locale/product-copy';
import { indexableMetadata } from '../public-metadata';

export function buildSeoulExploreMetadata(locale: ProductLocale, query: Readonly<Record<string, string | string[] | undefined>>) {
  const copy = {
    en: { title: 'Seoul sale, jeonse and monthly-rent evidence | signedprice', description: 'Compare verified all-area sale, jeonse and monthly-rent evidence across Seoul districts.', locale: 'en_US' as const },
    ko: { title: '서울 아파트·오피스텔 실거래가 · 매매·전세·월세 | signedprice', description: '서울 25개 구의 매매·전세·월세 실거래가를 지역과 건물별로 비교하고 출처 기간과 범위를 확인하세요.', locale: 'ko_KR' as const },
    'zh-CN': { title: '首尔住宅成交价 · 买卖、全租与月租 | signedprice', description: '按行政区与楼宇比较首尔 25 个区的买卖、全租与月租成交数据，并查看来源期间与覆盖范围。', locale: 'zh_CN' as const },
  }[locale];
  const metadata = indexableMetadata({ ...copy, path: localizedSeoulHref('/kr/seoul/explore/', locale) as `/${string}`, languageAlternates: { en: '/kr/seoul/explore/', ko: '/ko/kr/seoul/explore/', 'zh-Hans': '/zh-cn/kr/seoul/explore/' } });
  return Object.values(query).some(value => value !== undefined) ? { ...metadata, robots: { index: false, follow: true } } : metadata;
}
