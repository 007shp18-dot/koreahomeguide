import {
  getIntentHref,
  getMarketHref,
  getMarketProfile,
  intents,
  type CapabilityState,
  type Intent,
  type MarketId,
  type MarketProfile,
} from '@signedprice/market-core';
import type { Metadata } from 'next';
import type { SingaporeEntryModel } from './singapore/route-types';
import { indexableMetadata } from './public-metadata';

const brand = 'signedprice';
const headline = 'Know the market before you buy.';
const marketIds = [
  'kr-seoul',
  'sg-singapore',
  'ae-dubai',
] as const satisfies readonly MarketId[];

const intentLabels = {
  rent: 'Rent',
  buy: 'Buy',
  invest: 'Invest',
} as const satisfies Record<Intent, string>;

const productDepthLabels = {
  full_product: 'Evidence hub',
  market_intelligence: 'Market intelligence',
} as const satisfies Record<MarketProfile['productDepth'], string>;

const capabilityStateLabels = {
  available: 'Live evidence',
  limited: 'Limited',
  rights_blocked: 'Rights blocked',
} as const satisfies Record<CapabilityState, string>;

const englishMetadata = indexableMetadata({
  path: '/',
  title: 'signedprice | Real prices. Better property decisions.',
  description:
    'Compare property prices, rents and buying costs in Seoul, Singapore and Dubai, with transaction dates and sources.',
  languageAlternates: {
    en: '/',
    ko: '/ko/',
    'zh-Hans': '/zh-cn/',
  },
}) satisfies Metadata;

export interface NavigationLinkModel {
  readonly label: string;
  readonly href: string;
  readonly ariaLabel?: string;
  readonly isCurrent?: boolean;
  readonly index?: string;
  readonly description?: string;
}

export type GlobalNavigationItem = 'Explore' | 'Rankings' | 'Tools' | 'News & Insights' | 'Guides';

export interface SiteHeaderModel {
  readonly brand: string;
  readonly homeLabel: string;
  readonly homeHref?: string;
  readonly navigationLabel: string;
  readonly links: readonly NavigationLinkModel[];
  readonly navigationVariant?: 'product' | 'supplied';
  readonly showMarketNavigation?: boolean;
  readonly marketLabel?: string;
  readonly languageLabel?: string;
  readonly languageSwitch?: Readonly<{
    readonly label: string;
    readonly href: string;
    readonly hrefLang: 'en' | 'ko' | 'zh-CN';
  }>;
}

export interface SiteFooterModel {
  readonly brand: string;
  readonly descriptor: string;
  readonly navigationLabel: string;
  readonly links: readonly NavigationLinkModel[];
  readonly status: string;
}

export const productNavigationLinks = Object.freeze([
  { index: '01', label: 'Explore', description: 'Explore signed evidence', href: '/prices/' },
  { index: '02', label: 'Rankings', description: 'Compare recorded price levels', href: '/rankings/' },
  { index: '03', label: 'Tools', description: 'Calculate and compare terms', href: '/tools/' },
  { index: '04', label: 'News & Insights', description: 'Read official updates and original property analysis', href: '/news/' },
  { index: '05', label: 'Guides', description: 'Understand local decisions', href: '/guides/' },
] as const satisfies readonly (NavigationLinkModel & { readonly label: GlobalNavigationItem })[]);

export const KOREA_PUBLIC_RELEASE_STATUS =
  'Korea public evidence. Publication limits shown.' as const;

export interface TrustStripModel {
  readonly sectionLabel: string;
  readonly eyebrow: string;
  readonly heading: string;
  readonly description: string;
  readonly items: readonly {
    readonly term: string;
    readonly description: string;
  }[];
}

const englishHeaderCopy = {
  brand,
  homeLabel: 'signedprice home',
  navigationLabel: 'Primary navigation',
  links: productNavigationLinks,
  showMarketNavigation: true,
} as const satisfies SiteHeaderModel;

const englishTrustCopy = {
  sectionLabel: 'Evidence and publication principles',
  eyebrow: 'Trust and evidence',
  heading: 'Know what the numbers mean.',
  description:
    'Check where the data comes from, which period it covers and how each figure is calculated. We explain missing data and record corrections.',
  items: [
    {
      term: 'Evidence',
      description: 'Data source, transaction period, last update and sample size',
    },
    {
      term: 'Rights and method',
      description: 'How prices are calculated and which data we can display',
    },
    {
      term: 'Corrections',
      description:
        'See reported issues, our findings and any changes to the data',
    },
  ],
} as const satisfies TrustStripModel;

const englishFooterCopy = {
  brand,
  descriptor: 'Property prices and market context, made clear.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Markets', href: '/markets/' },
    { label: 'Prices', href: '/prices/' },
    { label: 'News', href: '/news/' },
    { label: 'Community', href: '/community/' },
    { label: 'Guides', href: '/guides/' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Back to top', href: '#top' },
  ],
  status: 'Market data is live. Listings, brokerage and personalized investment services are not currently offered.',
} as const satisfies SiteFooterModel;

export const homepageCopy = {
  brand,
  headline,
  marketIds,
  metadata: englishMetadata,
  header: englishHeaderCopy,
  hero: {
    eyebrow: 'Property intelligence for Seoul, Singapore and Dubai',
    headline,
    description:
      'Explore recorded property prices in Seoul, Singapore and Dubai, compare your budget and plan the costs of buying abroad.',
    intentHeading: 'Start with your decision',
    intentDescription:
      'Start with the city you are considering or compare what your budget could buy.',
    intentNavigationLabel: 'Browse markets by property intent',
  },
  markets: {
    sectionLabel: 'Market coverage',
    eyebrow: 'Market coverage',
    heading: 'Three cities. Local detail.',
    description:
      'Prices appear in local currency, with the source, period and available coverage shown alongside.',
    productDepthLabel: 'Product depth',
    dataRightsLabel: 'Data rights',
    limitationsLabel: 'Current limits',
  },
  principles: {
    sectionLabel: 'Product principles',
    eyebrow: 'One property journey',
    heading: 'From research to a purchase plan.',
    items: [
      {
        index: '01',
        title: 'Understand local prices',
        description:
          'Compare recorded transactions with an asking price, and check whether the size, property type and dates match.',
      },
      {
        index: '02',
        title: 'Decision tools',
        description:
          'Estimate purchase costs and rental income using your own assumptions.',
      },
      {
        index: '03',
        title: 'Prepare for the next step',
        description:
          'Use the buying guides to prepare questions for a local professional. Partner introductions are not yet available.',
      },
    ],
  },
  trust: englishTrustCopy,
  footer: englishFooterCopy,
} as const;

export type IntentGroupModel = {
  id: Intent;
  label: string;
  description: string;
  destinations: {
    label: string;
    ariaLabel: string;
    href: string;
  }[];
};

export const homepageIntentGroups: IntentGroupModel[] = intents.map((intent) => ({
  id: intent,
  label: intentLabels[intent],
  description: {
    rent: 'Compare contracted rents and local rental rules.',
    buy: 'Read signed sale prices before asking prices.',
    invest: 'Test yield only where every input is supported.',
  }[intent],
  destinations: marketIds.map((marketId) => {
    const market = getMarketProfile(marketId);

    return {
      label: market.cityName,
      ariaLabel: `${intentLabels[intent]} in ${market.cityName}`,
      href: getIntentHref(marketId, intent),
    };
  }),
}));

export type MarketCardModel = {
  id: MarketId;
  cityName: string;
  currency: string;
  dataLabel: string;
  overviewHref: string;
  overviewLabel: string;
  productDepthLabel: string;
  productDepthKind: MarketProfile['productDepth'];
  productDepth: string;
  dataRightsLabel: string;
  limitationsLabel: string;
  limitations: readonly string[];
  intentCapabilities: Record<Intent, {
    label: string;
    href: string;
    state: CapabilityState;
    stateLabel: string;
  }>;
  dataCapabilities: {
    label: string;
    state: CapabilityState;
    stateLabel: string;
  }[];
};

function createMarketCardModel(profile: MarketProfile): MarketCardModel {
  return {
    id: profile.id,
    cityName: profile.cityName,
    currency: profile.nativeCurrency,
    dataLabel: profile.dataLabel,
    overviewHref: getMarketHref(profile.id),
    overviewLabel: `Explore ${profile.cityName}`,
    productDepthLabel: homepageCopy.markets.productDepthLabel,
    productDepthKind: profile.productDepth,
    productDepth: productDepthLabels[profile.productDepth],
    dataRightsLabel: homepageCopy.markets.dataRightsLabel,
    limitationsLabel: homepageCopy.markets.limitationsLabel,
    limitations: profile.limitations,
    intentCapabilities: Object.fromEntries(
      intents.map((intent) => [
        intent,
        {
          label: `${intentLabels[intent]} decision path`,
          href: getIntentHref(profile.id, intent),
          state: profile.capabilities[intent],
          stateLabel: capabilityStateLabels[profile.capabilities[intent]],
        },
      ]),
    ) as MarketCardModel['intentCapabilities'],
    dataCapabilities: profile.dataCapabilities.map((capability) => ({
      label: capability.label,
      state: capability.state,
      stateLabel: capabilityStateLabels[capability.state],
    })),
  };
}

export const homepageMarketCards = marketIds.map((marketId) =>
  createMarketCardModel(getMarketProfile(marketId)),
);

export const homepageProductSlotIds = [
  'check',
  'explore',
  'rankings',
  'news',
  'guide',
  'community',
] as const;

export type HomepageProductSlotId = (typeof homepageProductSlotIds)[number];

export type HomepageProductSlotModel = Readonly<{
  id: HomepageProductSlotId;
  label: 'Check' | 'Explore' | 'Rankings' | 'News' | 'Guide' | 'Community';
  description: string;
  state: 'available' | 'unavailable' | 'rights_blocked';
  stateLabel: 'Available' | 'Unavailable' | 'Rights blocked';
  href?: string;
}>;

export type HomepageMarketModel = Readonly<{
  id: MarketId;
  tabId: 'seoul' | 'singapore' | 'dubai';
  cityName: 'Seoul' | 'Singapore' | 'Dubai';
  currency: 'KRW' | 'SGD' | 'AED';
  eyebrow: string;
  heading: string;
  description: string;
  slots: readonly HomepageProductSlotModel[];
}>;

const productLabels = {
  check: 'Check',
  explore: 'Explore',
  rankings: 'Rankings',
  news: 'News',
  guide: 'Guide',
  community: 'Community',
} as const satisfies Record<HomepageProductSlotId, HomepageProductSlotModel['label']>;

const seoulSlotDescriptions = {
  check: 'Compare two offers',
  explore: 'District and building evidence',
  rankings: 'Compare all 25 districts',
  news: 'Verified market briefs',
  guide: 'Methods and decision guides',
  community: 'Read-only local community foundation',
} as const satisfies Record<HomepageProductSlotId, string>;

const seoulSlotHrefs = {
  check: '/kr/seoul/check/',
  explore: '/kr/seoul/explore/',
  rankings: '/kr/seoul/rankings/',
  news: '/kr/seoul/news/',
  guide: '/kr/seoul/guide/',
  community: '/kr/seoul/community/',
} as const satisfies Record<HomepageProductSlotId, string | undefined>;

const singaporeUnavailableDescription = 'Verified Singapore evidence unavailable';
const dubaiRightsDescription = 'DLD and RERA display-rights clearance is incomplete.';

function productSlots(
  marketId: MarketId,
  singapore: SingaporeEntryModel,
): readonly HomepageProductSlotModel[] {
  return Object.freeze(homepageProductSlotIds.map((id) => {
    if (marketId === 'kr-seoul') {
      return Object.freeze({
        id,
        label: productLabels[id],
        description: seoulSlotDescriptions[id],
        state: 'available',
        stateLabel: 'Available',
        ...(seoulSlotHrefs[id] === undefined ? {} : { href: seoulSlotHrefs[id] }),
      } satisfies HomepageProductSlotModel);
    }

    if (marketId === 'sg-singapore') {
      const isReadyProduct = singapore.status === 'ready' && (id === 'explore' || id === 'check');
      const singaporeHref = id === 'explore' ? '/sg/singapore/explore/'
        : id === 'check' ? '/sg/singapore/check/' : `/sg/singapore/${id}/`;
      return Object.freeze({
        id,
        label: productLabels[id],
        description: isReadyProduct
          ? `${singapore.transactionLabel}. ${singapore.periodLabel}.`
          : singaporeUnavailableDescription,
        state: isReadyProduct ? 'available' : 'unavailable',
        stateLabel: isReadyProduct ? 'Available' : 'Unavailable',
        href: singaporeHref,
      } satisfies HomepageProductSlotModel);
    }

    return Object.freeze({
      id,
      label: productLabels[id],
      description: dubaiRightsDescription,
      state: 'rights_blocked',
      stateLabel: 'Rights blocked',
      href: `/ae/dubai/${id}/`,
    } satisfies HomepageProductSlotModel);
  }));
}

function homepageMarkets(singapore: SingaporeEntryModel): readonly HomepageMarketModel[] {
  return Object.freeze(marketIds.map((marketId) => {
    const profile = getMarketProfile(marketId);
    if (marketId === 'kr-seoul') {
      return Object.freeze({
        id: marketId,
        tabId: 'seoul',
        cityName: 'Seoul',
        currency: profile.nativeCurrency,
        eyebrow: 'Seoul live',
        heading: 'Official contract evidence, one click from the front door.',
        description:
          'Signed contracts, split by new and renewal status, with publication limits shown.',
        slots: productSlots(marketId, singapore),
      } satisfies HomepageMarketModel);
    }
    if (marketId === 'sg-singapore') {
      return Object.freeze({
        id: marketId,
        tabId: 'singapore',
        cityName: 'Singapore',
        currency: profile.nativeCurrency,
        eyebrow: 'Singapore evidence',
        heading: singapore.status === 'ready'
          ? 'Verified private residential sale evidence.'
          : singapore.message,
        description: singapore.status === 'ready'
          ? `${singapore.projectLabel}. Completed period ${singapore.periodLabel}.`
          : 'Explore remains unavailable until the verified snapshot and display-rights gates pass.',
        slots: productSlots(marketId, singapore),
      } satisfies HomepageMarketModel);
    }
    return Object.freeze({
      id: marketId,
      tabId: 'dubai',
      cityName: 'Dubai',
      currency: profile.nativeCurrency,
      eyebrow: 'Dubai rights status',
      heading: dubaiRightsDescription,
      description:
        'Transaction detail remains rights-blocked until a licensed-provider boundary is established.',
      slots: productSlots(marketId, singapore),
    } satisfies HomepageMarketModel);
  }));
}

export function buildHomepagePresentation(singapore: SingaporeEntryModel): Readonly<{
  copy: typeof homepageCopy & Readonly<{ header: SiteHeaderModel }>;
  markets: readonly HomepageMarketModel[];
  singapore: SingaporeEntryModel;
}> {
  const copy = {
    ...homepageCopy,
    header: {
      ...homepageCopy.header,
      links: homepageCopy.header.links,
    },
  } as typeof homepageCopy & Readonly<{ header: SiteHeaderModel }>;
  return Object.freeze({
    copy,
    markets: homepageMarkets(singapore),
    singapore,
  });
}
