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

const brand = 'signedprice';
const headline = 'Real prices. Better property decisions.';
const marketIds = ['kr-seoul', 'sg-singapore', 'ae-dubai'] as const satisfies readonly MarketId[];

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

const englishMetadata = {
  title: 'signedprice | Real prices. Better property decisions.',
  description:
    'Property intelligence for Seoul, Singapore and Dubai, with market-specific sources, product depth and data-rights limits shown clearly.',
  robots: {
    index: false,
    follow: true,
  },
} as const satisfies Metadata;

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
  sectionLabel: 'Phase 1 disclosure and publication principles',
  eyebrow: 'Phase 1 disclosure',
  heading: 'Current source posture, without invented detail.',
  description:
    'These preview pages show market-level source posture, product depth and data-rights limits. Dataset identifiers, periods, correction status and methodology notes are not yet published.',
  items: [
    {
      term: 'Published now',
      description: 'Market-level source posture and rights limitations',
    },
    {
      term: 'Not yet published',
      description: 'Dataset identifiers, periods, correction status and methodology notes',
    },
    {
      term: 'Publication principle',
      description:
        'Future evidence will carry its source, period, methodology, correction and rights labels',
    },
  ],
} as const satisfies TrustStripModel;

const englishFooterCopy = {
  brand,
  descriptor: 'Property intelligence for Seoul, Singapore and Dubai.',
  navigationLabel: 'Footer navigation',
  links: [
    { label: 'Markets', href: '#markets' },
    { label: 'Methodology', href: '#methodology' },
    { label: 'Back to top', href: '#top' },
  ],
  status: 'Preview foundation. Public launch is not yet authorized.',
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
