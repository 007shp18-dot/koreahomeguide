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
const headline = 'Real prices. Better property decisions.';
const marketIds = ['kr-seoul'] as const satisfies readonly MarketId[];

const intentLabels = {
  rent: 'Rent',
  buy: 'Buy',
  invest: 'Invest',
} as const satisfies Record<Intent, string>;

const productDepthLabels = {
  full_product: 'Full product',
  market_intelligence: 'Market intelligence',
} as const satisfies Record<MarketProfile['productDepth'], string>;

const capabilityStateLabels = {
  available: 'Available',
  limited: 'Limited',
  rights_blocked: 'Rights blocked',
} as const satisfies Record<CapabilityState, string>;

const englishMetadata = indexableMetadata({
  path: '/',
  title: 'signedprice | Real prices. Better property decisions.',
  description:
    'Verified Seoul property intelligence with official-source context and publication limits shown clearly.',
}) satisfies Metadata;

export interface NavigationLinkModel {
  readonly label: string;
  readonly href: string;
  readonly ariaLabel?: string;
  readonly isCurrent?: boolean;
}

export interface SiteHeaderModel {
  readonly brand: string;
  readonly homeLabel: string;
  readonly navigationLabel: string;
  readonly links: readonly NavigationLinkModel[];
}

export interface SiteFooterModel {
  readonly brand: string;
  readonly descriptor: string;
  readonly navigationLabel: string;
  readonly links: readonly NavigationLinkModel[];
  readonly status: string;
}

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
  links: [
    { label: 'Global home', href: '/', ariaLabel: 'Global home', isCurrent: true },
    { label: 'Market overview', href: '#markets', ariaLabel: 'Markets' },
  ],
} as const satisfies SiteHeaderModel;

const englishTrustCopy = {
  sectionLabel: 'Evidence and publication principles',
  eyebrow: 'Trust and evidence',
  heading: 'Every number travels with its boundary.',
  description:
    'SignedPrice publishes source, period, methodology, rights and correction context with verified evidence. Unsupported accuracy figures stay unpublished.',
  items: [
    {
      term: 'Evidence',
      description: 'Source, completed period, generation time and publication minimum',
    },
    {
      term: 'Rights and method',
      description: 'Market-specific methodology and operation-level rights limits',
    },
    {
      term: 'Corrections',
      description:
        'Fixed and upheld reports remain visible in market correction ledgers',
    },
  ],
} as const satisfies TrustStripModel;

const englishFooterCopy = {
  brand,
  descriptor: 'Verified property intelligence for Seoul.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Markets', href: '#markets' },
    { label: 'Trust', href: '/trust/' },
    { label: 'Back to top', href: '#top' },
  ],
  status: 'Global platform live. Market evidence remains rights-gated.',
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
      'We publish only official or rights-cleared market intelligence, and show the limits wherever detail is unavailable.',
    intentHeading: 'Start with your decision',
    intentDescription:
      'Choose an intent, then enter the market whose local evidence and rules matter.',
    intentNavigationLabel: 'Browse markets by property intent',
  },
  markets: {
    sectionLabel: 'Market coverage',
    eyebrow: 'Market coverage',
    heading: 'Local evidence, honestly scoped.',
    description:
      'Every market keeps its native currency, source context and publication limits.',
    productDepthLabel: 'Product depth',
    dataRightsLabel: 'Data rights',
    limitationsLabel: 'Current limits',
  },
  principles: {
    sectionLabel: 'Product principles',
    eyebrow: 'One property journey',
    heading: 'Truth before transaction.',
    items: [
      {
        index: '01',
        title: 'Market truth',
        description:
          'Official and licensed evidence stays separate from asking prices, estimates and sponsored material.',
      },
      {
        index: '02',
        title: 'Decision tools',
        description:
          'Local costs, rules and comparable scenarios turn market evidence into a clearer next step.',
      },
      {
        index: '03',
        title: 'Verified connections',
        description:
          'Professional connections remain unavailable until licensing, consent and operating gates pass.',
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

export function buildHomepagePresentation(singapore: SingaporeEntryModel): Readonly<{
  copy: typeof homepageCopy & Readonly<{ marketIds: readonly MarketId[]; header: SiteHeaderModel }>;
  groups: readonly IntentGroupModel[];
  markets: readonly MarketCardModel[];
}> {
  const singaporeReady = singapore.status === 'ready';
  const visibleMarketIds: readonly MarketId[] = singaporeReady
    ? ['kr-seoul', 'sg-singapore']
    : ['kr-seoul'];
  const copy = {
    ...homepageCopy,
    marketIds: visibleMarketIds,
    header: {
      ...homepageCopy.header,
      links: singaporeReady
        ? [...homepageCopy.header.links, {
            label: 'Singapore evidence', href: '/sg/', ariaLabel: 'Singapore evidence',
          }]
        : homepageCopy.header.links,
    },
  } as typeof homepageCopy & Readonly<{ marketIds: readonly MarketId[]; header: SiteHeaderModel }>;
  const groups = intents.map((intent) => ({
    id: intent,
    label: intentLabels[intent],
    description: {
      rent: 'Compare contracted rents and local rental rules.',
      buy: 'Read signed sale prices before asking prices.',
      invest: 'Test yield only where every input is supported.',
    }[intent],
    destinations: visibleMarketIds.map((marketId) => {
      const market = getMarketProfile(marketId);
      return {
        label: market.cityName,
        ariaLabel: `${intentLabels[intent]} in ${market.cityName}`,
        href: marketId === 'sg-singapore' ? '/sg/' : getIntentHref(marketId, intent),
      };
    }),
  }));
  return Object.freeze({
    copy,
    groups: Object.freeze(groups),
    markets: Object.freeze(visibleMarketIds.map((marketId) => {
      const card = createMarketCardModel(getMarketProfile(marketId));
      if (marketId !== 'sg-singapore') return card;
      return {
        ...card,
        overviewHref: '/sg/',
        overviewLabel: 'Explore Singapore evidence',
        intentCapabilities: Object.fromEntries(intents.map((intent) => [
          intent,
          { ...card.intentCapabilities[intent], href: '/sg/' },
        ])) as MarketCardModel['intentCapabilities'],
      };
    })),
  });
}
