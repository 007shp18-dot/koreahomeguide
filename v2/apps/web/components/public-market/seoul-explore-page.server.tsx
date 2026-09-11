import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import type { ProductLocale } from '@/lib/locale/product-copy';
import { KOREA_EVIDENCE_AREA_BANDS } from '@signedprice/korea-rent';
import { SEOUL_RENT_CHECK_DISTRICTS } from '@signedprice/korea-rent/browser';
import { AreaExplorer } from '@/components/public-market/area-explorer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { PublicBreadcrumbJsonLd } from '@/components/public-json-ld';
import {
  buildPublicAreaExploreModel,
  hydratePublicAreaExploreModelWithProjections,
} from '@/lib/public-market/area-route-model.server';
import { parseExplorerSelection } from '@/lib/navigation/explorer-selection';
import {
  KOREA_PUBLIC_RELEASE_STATUS,
  type SiteFooterModel,
  type SiteHeaderModel,
} from '@/lib/site-copy';
import { KOREA_EXPLORER_HOUSING_TYPES } from '@/lib/public-market/korea-explorer-evidence.server';

type ExplorerPageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
  readonly locale?: ProductLocale;
};

const header: SiteHeaderModel = {
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Seoul evidence navigation',
  marketLabel: 'Seoul',
  languageLabel: 'EN',
  languageSwitch: {
    label: 'KO',
    href: '/ko/kr/seoul/explore/',
    hrefLang: 'ko',
  },
  links: [
    { label: 'Global home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'District evidence', href: '/kr/seoul/explore/', isCurrent: true },
  ],
};

const footer: SiteFooterModel = {
  brand: 'signedprice',
  descriptor: 'Seoul sale, jeonse and monthly-rent evidence, with source periods and coverage shown.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Home', href: '/' },
    { label: 'Seoul market', href: '/kr/seoul/' },
    { label: 'Compare markets', href: '/compare/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Corrections', href: '/kr/seoul/corrections/' },
  ],
  status: KOREA_PUBLIC_RELEASE_STATUS,
};

function singleValue(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export default async function SeoulExplorePage({ searchParams, locale = 'en' }: ExplorerPageProps) {
  const labels = locale === 'zh-CN' ? {
    home: '首页', seoul: '首尔', explore: '探索', market: '首尔市场', compare: '比较市场', trust: '数据原则', corrections: '数据更正',
    descriptor: '首尔买卖、全租及月租成交数据，注明来源期间与覆盖范围。',
  } : locale === 'ko' ? {
    home: '홈', seoul: '서울', explore: '실거래가 탐색', market: '서울 시장', compare: '시장 비교', trust: '데이터 기준', corrections: '자료 정정',
    descriptor: '출처 기간과 범위를 확인할 수 있는 서울 매매·전세·월세 실거래가입니다.',
  } : { home: 'Home', seoul: 'Seoul', explore: 'Explore', market: 'Seoul market', compare: 'Compare markets', trust: 'Trust', corrections: 'Data corrections', descriptor: footer.descriptor };
  const prefix = locale === 'en' ? '' : locale === 'ko' ? '/ko' : '/zh-cn';
  const localizedHeader: SiteHeaderModel = { ...header, marketLabel: labels.seoul,
    languageLabel: locale === 'zh-CN' ? 'ZH' : locale === 'ko' ? 'KO' : 'EN',
    homeLabel: `SignedPrice ${labels.home}`,
    links: [{ label: labels.home, href: `${prefix}/` }, { label: labels.market, href: `${prefix}/kr/seoul/` }, { label: labels.explore, href: `${prefix}/kr/seoul/explore/`, isCurrent: true }],
  };
  const localizedFooter: SiteFooterModel = { ...footer, descriptor: labels.descriptor,
    links: [{ label: labels.home, href: `${prefix}/` }, { label: labels.market, href: `${prefix}/kr/seoul/` }, { label: labels.compare, href: `${prefix}/compare/` }, { label: labels.trust, href: '/trust/' }, { label: labels.corrections, href: '/kr/seoul/corrections/' }],
  };
  const query = await searchParams;
  const selection = parseExplorerSelection(
    query,
    { market: 'kr', transaction: 'sale' },
    {
      areas: KOREA_EVIDENCE_AREA_BANDS,
      propertyTypes: KOREA_EXPLORER_HOUSING_TYPES.filter((value) => value !== 'all'),
      districts: SEOUL_RENT_CHECK_DISTRICTS.map(({ slug }) => slug),
    },
  );
  const requestedBuildingId = singleValue(query.buildingId);
  const model = await hydratePublicAreaExploreModelWithProjections(buildPublicAreaExploreModel(
    selection.district,
    undefined,
    selection.contractType ?? singleValue(query.contract),
    singleValue(query.q),
    {
      transaction: selection.transaction,
      areaBand: selection.area,
      housingType: selection.propertyType,
      contractGroup: selection.contractType ?? singleValue(query.contract),
    },
    singleValue(query.buildingPage),
    requestedBuildingId,
    query,
    singleValue(query.neighborhood),
  ));
  const availableBuildings = model.status === 'ready'
    ? (model.buildingAvailability.status === 'ready'
      ? model.buildingAvailability.buildings
      : model.buildingAvailability.fallbackBuildings)
    : Object.freeze([]);
  const requestedBuilding = requestedBuildingId === undefined
    ? undefined
    : availableBuildings
      .find((building) => (
        building.id === requestedBuildingId
        && building.districtSlug === model.selectedSlug
      ));
  const requestedNeighborhood = singleValue(query.neighborhood);
  const restoredSelection = requestedBuilding !== undefined
    ? Object.freeze({
      ...selection,
      district: requestedBuilding.districtSlug,
      neighborhood: requestedBuilding.neighborhoodId,
      buildingId: requestedBuilding.id,
    })
    : requestedNeighborhood !== undefined && availableBuildings.some((building) => (
      building.districtSlug === model.selectedSlug
      && building.neighborhoodId === requestedNeighborhood
    ))
      ? Object.freeze({ ...selection, neighborhood: requestedNeighborhood })
      : selection;
  const naverMapClientId = process.env.NAVER_MAP_CLIENT_ID?.trim() || null;

  return (
    <div id="top" className="explorer-page">
      <SiteHeader copy={localizedHeader} />
      <main>
        <AreaExplorer
          locale={locale}
          model={model}
          naverMapClientId={naverMapClientId}
          googleMapsBrowserKey={googleMapsBrowserKeyFromEnvironment()}
          initialQuery={singleValue(query.q)}
          initialSelection={restoredSelection}
        />
      </main>
      <PublicBreadcrumbJsonLd items={[
        { name: labels.home, path: `${prefix}/` },
        { name: labels.seoul, path: `${prefix}/kr/seoul/` },
        { name: labels.explore, path: `${prefix}/kr/seoul/explore/` },
      ]} />
      <SiteFooter locale={locale} copy={localizedFooter} />
    </div>
  );
}
