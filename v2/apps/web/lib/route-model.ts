import {
  evaluateReadiness,
  getIntentHref,
  getMarketByRoute,
  getMarketHref,
  getMarketProfile,
  intents,
  type CapabilityState,
  type HousingSectorCode,
  type Intent,
  type MarketId,
  type MarketProfile,
} from '@signedprice/market-core';
import type { Metadata } from 'next';
import type { SiteFooterModel, SiteHeaderModel } from './site-copy';

export interface NavigationActionModel {
  readonly label: string;
  readonly href: string;
  readonly description: string;
  readonly external: boolean;
}

export interface MarketHeroModel {
  readonly sectionLabel: string;
  readonly eyebrow: string;
  readonly heading: string;
  readonly description: string;
  readonly facts: readonly {
    readonly label: string;
    readonly value: string;
  }[];
}

export interface CapabilityItemModel {
  readonly label: string;
  readonly description: string;
  readonly state: CapabilityState;
  readonly stateLabel: string;
  readonly housingSector: HousingSectorCode | null;
  readonly href?: string;
}

export interface CapabilityGridModel {
  readonly sectionLabel: string;
  readonly eyebrow: string;
  readonly heading: string;
  readonly description: string;
  readonly items: readonly CapabilityItemModel[];
}

export interface MarketLimitationsModel {
  readonly sectionLabel: string;
  readonly eyebrow: string;
  readonly heading: string;
  readonly description: string;
  readonly items: readonly string[];
  readonly actionsLabel: string;
  readonly actions: readonly NavigationActionModel[];
}

export interface ComparisonCellModel {
  readonly marketId: MarketId;
  readonly state: CapabilityState;
  readonly stateLabel: string;
  readonly description: string;
}

export interface ComparisonMatrixModel {
  readonly sectionLabel: string;
  readonly eyebrow: string;
  readonly heading: string;
  readonly description: string;
  readonly sectorBoundary: string;
  readonly tableLabel: string;
  readonly rowHeaderLabel: string;
  readonly columns: readonly {
    readonly marketId: MarketId;
    readonly label: string;
  }[];
  readonly rows: readonly {
    readonly label: string;
    readonly cells: readonly ComparisonCellModel[];
  }[];
}

export interface MarketPageModel {
  readonly metadata: Metadata;
  readonly marketId: MarketId;
  readonly productDepth: MarketProfile['productDepth'];
  readonly nativeCurrency: MarketProfile['nativeCurrency'];
  readonly readiness: ReturnType<typeof evaluateReadiness>;
  readonly header: SiteHeaderModel;
  readonly footer: SiteFooterModel;
  readonly hero: MarketHeroModel;
  readonly intentGrid: CapabilityGridModel;
  readonly capabilityGrid: CapabilityGridModel;
  readonly capabilities: readonly CapabilityItemModel[];
  readonly limitations: MarketLimitationsModel;
  readonly nextAction: NavigationActionModel;
}

export interface IntentPageModel {
  readonly metadata: Metadata;
  readonly marketId: MarketId;
  readonly intent: Intent;
  readonly href: string;
  readonly readiness: ReturnType<typeof evaluateReadiness>;
  readonly header: SiteHeaderModel;
  readonly footer: SiteFooterModel;
  readonly hero: MarketHeroModel;
  readonly comparisonScope: CapabilityGridModel;
  readonly sourcePosture: CapabilityGridModel;
  readonly limitations: MarketLimitationsModel;
}

export interface ComparisonPageModel {
  readonly metadata: Metadata;
  readonly readiness: ReturnType<typeof evaluateReadiness>;
  readonly header: SiteHeaderModel;
  readonly footer: SiteFooterModel;
  readonly hero: MarketHeroModel;
  readonly matrix: ComparisonMatrixModel;
  readonly limitations: MarketLimitationsModel;
}

type MarketRouteCopy = {
  heroDescription: string;
  sourcePosture: string;
  capabilities: readonly CapabilityItemModel[];
  nextAction: NavigationActionModel;
};

const initialMarketIds = [
  'kr-seoul',
  'sg-singapore',
  'ae-dubai',
] as const satisfies readonly MarketId[];

const intentLabels = {
  rent: 'Rent',
  buy: 'Buy',
  invest: 'Invest',
} as const satisfies Record<Intent, string>;

const intentDescriptions = {
  rent: 'Review compatible rent evidence, native payment terms and local rental rules.',
  buy: 'Review compatible sale evidence, ownership-cost inputs and foreign-buyer rules.',
  invest:
    'Review compatible rent and sale evidence, ownership-cost inputs and complete-input requirements.',
} as const satisfies Record<Intent, string>;

const intentComparisonItems = {
  rent: [
    {
      label: 'Reported rent evidence',
      description: 'Keep each source class and housing sector explicit.',
    },
    {
      label: 'Native payment terms',
      description: 'Keep deposit and recurring rent terms in their source structure.',
    },
    {
      label: 'Local rental rules',
      description: 'Show dated, market-specific guidance only when its source is clear.',
    },
  ],
  buy: [
    {
      label: 'Reported sale evidence',
      description: 'Keep reported contracts separate from asking or developer material.',
    },
    {
      label: 'Ownership-cost inputs',
      description: 'Leave missing components unknown instead of treating them as free.',
    },
    {
      label: 'Foreign-buyer rules',
      description: 'Show dated, jurisdiction-specific guidance with explicit limits.',
    },
  ],
  invest: [
    {
      label: 'Compatible rent and sale evidence',
      description: 'Compare only compatible source classes, sectors and area bases.',
    },
    {
      label: 'Ownership-cost inputs',
      description: 'Keep unavailable components excluded or unknown.',
    },
    {
      label: 'Yield analysis requirements',
      description: 'Publish analysis only when rent, sale and cost inputs are all sourced.',
    },
  ],
} as const satisfies Record<
  Intent,
  readonly { readonly label: string; readonly description: string }[]
>;

const productDepthLabels = {
  full_product: 'Full product',
  market_intelligence: 'Market intelligence',
} as const satisfies Record<MarketProfile['productDepth'], string>;

const stateLabels = {
  available: 'available',
  limited: 'limited',
  rights_blocked: 'rights blocked',
} as const satisfies Record<CapabilityState, string>;

const routeShellCopy = {
  header: {
    brand: 'signedprice',
    homeLabel: 'signedprice home',
    navigationLabel: 'Primary navigation',
    links: [
      { label: 'Markets', href: '/#markets' },
      { label: 'Compare markets', href: '/compare/' },
      { label: 'Methodology', href: '/#methodology' },
    ],
  } satisfies SiteHeaderModel,
  footer: {
    brand: 'signedprice',
    descriptor: 'Property intelligence for Seoul, Singapore and Dubai.',
    navigationLabel: 'Footer navigation',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Markets', href: '/#markets' },
      { label: 'Compare markets', href: '/compare/' },
    ],
    status: 'Preview foundation. Public launch is not yet authorized.',
  } satisfies SiteFooterModel,
} as const;

const routeSectionCopy = {
  facts: {
    productDepth: 'Product depth',
    currency: 'Native currency',
    sourcePosture: 'Source posture',
    availability: 'Route availability',
    market: 'Market',
  },
  marketIntents: {
    sectionLabel: 'Supported property intents',
    eyebrow: 'Decision routes',
    heading: 'Choose the decision you are making.',
    description:
      'Each route keeps its market evidence, local rules and rights boundary explicit.',
  },
  marketCapabilities: {
    sectionLabel: 'Market capability and rights',
    eyebrow: 'Evidence boundary',
    heading: 'What is usable now, and what remains blocked.',
    description:
      'Availability follows the declared source, housing-sector and publication rights.',
  },
  limitations: {
    sectionLabel: 'Current market limitations',
    eyebrow: 'Known limits',
    heading: 'Unavailable means unavailable.',
    description:
      'These boundaries stay visible until the exact content, rights and operating gates pass.',
    actionsLabel: 'Available next steps',
  },
  intentComparison: {
    sectionLabel: 'Decision comparison scope',
    eyebrow: 'Comparison scope',
    heading: 'What signedprice will compare.',
    description:
      'The route explains the decision inputs without publishing unsupported values.',
  },
  intentSources: {
    sectionLabel: 'Usable sources and blocked detail',
    eyebrow: 'Source posture',
    heading: 'Source classes stay separate.',
    description:
      'A usable public or official source never grants rights to an unrelated dataset.',
  },
} as const;

const routeMetadataCopy = {
  market(profile: MarketProfile): Metadata {
    return {
      title: `${profile.cityName} property intelligence | signedprice`,
      description: `Review ${profile.cityName} Phase 1 product depth, source posture, supported property intents and current data-rights limits.`,
    };
  },
  intent(profile: MarketProfile, intent: Intent): Metadata {
    return {
      title: `${intentLabels[intent]} in ${profile.cityName} | signedprice`,
      description: `Review the Phase 1 ${intent} comparison scope, source posture and data-rights limits for ${profile.cityName}.`,
    };
  },
  compare: {
    title: 'Compare Seoul, Singapore and Dubai | signedprice',
    description:
      'Compare the Phase 1 capability and rights posture for rent, buy and invest decisions across Seoul, Singapore and Dubai.',
  },
  notFound: {
    title: 'Route not available | signedprice',
    description:
      'This signedprice Preview route is not available. Return to the approved market and comparison routes.',
  },
} as const;

const commonActions = {
  compare: {
    label: 'Compare markets',
    href: '/compare/',
    description: 'Review capability and rights posture across the initial markets.',
    external: false,
  },
  home: {
    label: 'Return to signedprice home',
    href: '/',
    description: 'Browse every supported market and property intent.',
    external: false,
  },
} as const satisfies Record<string, NavigationActionModel>;

const seoulProfile = getMarketProfile('kr-seoul');
const singaporeProfile = getMarketProfile('sg-singapore');
const dubaiProfile = getMarketProfile('ae-dubai');

const seoulOfficialState = seoulProfile.dataCapabilities[0]!.state;
const singaporeHdb = singaporeProfile.dataCapabilities.find(
  (capability) => capability.housingSector === 'hdb',
)!;
const singaporePrivate = singaporeProfile.dataCapabilities.find(
  (capability) => capability.housingSector === 'private_residential',
)!;
const dubaiTransactions = dubaiProfile.dataCapabilities.find(
  (capability) => capability.dataScope === 'transaction_detail',
)!;

const marketCopyById = {
  'kr-seoul': {
    heroDescription:
      'Official reported rent and sale evidence supports the full signedprice product posture for Seoul. Live rent exploration continues on KoreaHomeGuide during the brand transition.',
    sourcePosture: 'Official reported rent and sale evidence',
    capabilities: [
      {
        label: 'Official contract intelligence',
        description: 'Reported rent and sale evidence remains classified by source and event type.',
        state: seoulOfficialState,
        stateLabel: stateLabels[seoulOfficialState],
        housingSector: null,
      },
      {
        label: 'Live rent exploration',
        description: 'The existing KoreaHomeGuide Rent Explorer remains the live transition tool.',
        state: 'available',
        stateLabel: stateLabels.available,
        housingSector: null,
        href: 'https://koreahomeguide.com/explore/',
      },
      {
        label: 'Professional connection detail',
        description: 'Professional connections remain unavailable until operating gates pass.',
        state: 'rights_blocked',
        stateLabel: stateLabels.rights_blocked,
        housingSector: null,
      },
    ],
    nextAction: {
      label: 'Open the KoreaHomeGuide Rent Explorer',
      href: 'https://koreahomeguide.com/explore/',
      description:
        'Continue to the existing live Seoul research tool under the KoreaHomeGuide transition brand.',
      external: true,
    },
  },
  'sg-singapore': {
    heroDescription:
      'HDB public market intelligence is available with sector-specific limits. Private residential detail remains a separate rights-blocked capability.',
    sourcePosture: 'HDB public intelligence; private detail rights-blocked',
    capabilities: [
      {
        label: 'HDB public intelligence',
        description: 'Public HDB market intelligence is usable within its own housing sector.',
        state: singaporeHdb.state,
        stateLabel: stateLabels[singaporeHdb.state],
        housingSector: 'hdb',
      },
      {
        label: 'Private residential detail',
        description: 'Commercial publication rights have not been approved for this dataset.',
        state: singaporePrivate.state,
        stateLabel: stateLabels[singaporePrivate.state],
        housingSector: 'private_residential',
      },
      {
        label: 'Professional connection detail',
        description:
          'Professional and developer connections remain unavailable pending advertising and referral review.',
        state: 'rights_blocked',
        stateLabel: stateLabels.rights_blocked,
        housingSector: null,
      },
    ],
    nextAction: {
      label: 'Review Singapore rent scope',
      href: '/sg/singapore/rent/',
      description: 'See how the HDB public boundary applies to a rent decision.',
      external: false,
    },
  },
  'ae-dubai': {
    heroDescription:
      'Area and project context is limited to rights-cleared material. Licensed transaction and professional connection detail remain separately blocked.',
    sourcePosture: 'Rights-cleared context; licensed transaction detail blocked',
    capabilities: [
      {
        label: 'Area and project context',
        description:
          'Only rights-cleared descriptive context can be used; no contract detail is inferred.',
        state: 'limited',
        stateLabel: stateLabels.limited,
        housingSector: null,
      },
      {
        label: 'Transaction detail',
        description: 'A licensed-provider publication boundary has not been established.',
        state: dubaiTransactions.state,
        stateLabel: stateLabels[dubaiTransactions.state],
        housingSector: null,
      },
      {
        label: 'Professional connection detail',
        description:
          'Professional and project connections remain unavailable until regulatory and data-rights gates pass.',
        state: 'rights_blocked',
        stateLabel: stateLabels.rights_blocked,
        housingSector: null,
      },
    ],
    nextAction: {
      label: 'Review Dubai buy scope',
      href: '/ae/dubai/buy/',
      description: 'See the exact context and detail boundaries for a buy decision.',
      external: false,
    },
  },
} as const satisfies Record<MarketId, MarketRouteCopy>;

const intentSourceCopyByMarket = {
  'kr-seoul': [
    {
      label: 'Official reported contract intelligence',
      description: 'Rent and sale event types remain distinct and source-labelled.',
      state: seoulOfficialState,
      stateLabel: stateLabels[seoulOfficialState],
      housingSector: null,
    },
    {
      label: 'Professional connection detail',
      description: 'Professional connections remain unavailable until operating gates pass.',
      state: 'rights_blocked',
      stateLabel: stateLabels.rights_blocked,
      housingSector: null,
    },
  ],
  'sg-singapore': [
    {
      label: 'HDB public market intelligence',
      description: 'Usable only within the HDB housing sector and its stated limitations.',
      state: singaporeHdb.state,
      stateLabel: stateLabels[singaporeHdb.state],
      housingSector: 'hdb',
    },
    {
      label: 'Private residential detail',
      description: 'Private residential publication rights remain unapproved.',
      state: singaporePrivate.state,
      stateLabel: stateLabels[singaporePrivate.state],
      housingSector: 'private_residential',
    },
  ],
  'ae-dubai': [
    {
      label: 'Rights-cleared area and project context',
      description: 'Usable only as limited descriptive context, not contract evidence.',
      state: 'limited',
      stateLabel: stateLabels.limited,
      housingSector: null,
    },
    {
      label: 'Licensed transaction detail',
      description: 'Publication remains blocked until a licensed-provider boundary is approved.',
      state: dubaiTransactions.state,
      stateLabel: stateLabels[dubaiTransactions.state],
      housingSector: null,
    },
  ],
} as const satisfies Record<MarketId, readonly CapabilityItemModel[]>;

const previewReadiness = evaluateReadiness({
  contentReady: true,
  rightsCanIndex: false,
  domainReady: false,
});

export const marketRouteParams = initialMarketIds.map((marketId) => {
  const market = getMarketProfile(marketId);
  return { country: market.countryCode, city: market.citySlug };
});

export const intentRouteParams = initialMarketIds.flatMap((marketId) => {
  const market = getMarketProfile(marketId);
  return intents.map((intent) => ({
    country: market.countryCode,
    city: market.citySlug,
    intent,
  }));
});

function isIntent(value: string): value is Intent {
  return intents.some((intent) => intent === value);
}

function marketOverviewAction(marketId: MarketId): NavigationActionModel {
  const market = getMarketProfile(marketId);
  return {
    label: `Return to ${market.cityName} overview`,
    href: getMarketHref(marketId),
    description: `Review the full ${market.cityName} market capability boundary.`,
    external: false,
  };
}

export function buildMarketPageModel(
  countryCode: string,
  citySlug: string,
): MarketPageModel | undefined {
  const profile = getMarketByRoute(countryCode, citySlug);
  if (!profile) return undefined;

  const copy = marketCopyById[profile.id];
  const intentItems = intents.map((intent) => ({
    label: `${intentLabels[intent]} in ${profile.cityName}`,
    description: intentDescriptions[intent],
    state: profile.capabilities[intent],
    stateLabel: stateLabels[profile.capabilities[intent]],
    housingSector: null,
    href: getIntentHref(profile.id, intent),
  }));

  return {
    metadata: routeMetadataCopy.market(profile),
    marketId: profile.id,
    productDepth: profile.productDepth,
    nativeCurrency: profile.nativeCurrency,
    readiness: previewReadiness,
    header: routeShellCopy.header,
    footer: routeShellCopy.footer,
    hero: {
      sectionLabel: `${profile.cityName} market overview`,
      eyebrow: `${profile.cityName} market`,
      heading: profile.cityName,
      description: copy.heroDescription,
      facts: [
        {
          label: routeSectionCopy.facts.productDepth,
          value: productDepthLabels[profile.productDepth],
        },
        { label: routeSectionCopy.facts.currency, value: profile.nativeCurrency },
        { label: routeSectionCopy.facts.sourcePosture, value: copy.sourcePosture },
      ],
    },
    intentGrid: {
      ...routeSectionCopy.marketIntents,
      items: intentItems,
    },
    capabilityGrid: {
      ...routeSectionCopy.marketCapabilities,
      items: copy.capabilities,
    },
    capabilities: copy.capabilities,
    limitations: {
      ...routeSectionCopy.limitations,
      items: profile.limitations,
      actions: [copy.nextAction, commonActions.compare],
    },
    nextAction: copy.nextAction,
  };
}

export function buildIntentPageModel(
  countryCode: string,
  citySlug: string,
  intentValue: string,
): IntentPageModel | undefined {
  const profile = getMarketByRoute(countryCode, citySlug);
  if (!profile || !isIntent(intentValue)) return undefined;

  const state = profile.capabilities[intentValue];
  const intentLabel = intentLabels[intentValue];
  const comparisonItems = intentComparisonItems[intentValue].map((item) => ({
    ...item,
    state,
    stateLabel: stateLabels[state],
    housingSector: null,
  }));

  return {
    metadata: routeMetadataCopy.intent(profile, intentValue),
    marketId: profile.id,
    intent: intentValue,
    href: getIntentHref(profile.id, intentValue),
    readiness: previewReadiness,
    header: routeShellCopy.header,
    footer: routeShellCopy.footer,
    hero: {
      sectionLabel: `${intentLabel} in ${profile.cityName}`,
      eyebrow: `${profile.cityName} · ${intentLabel}`,
      heading: `${intentLabel} in ${profile.cityName}`,
      description: intentDescriptions[intentValue],
      facts: [
        { label: routeSectionCopy.facts.market, value: profile.cityName },
        { label: routeSectionCopy.facts.currency, value: profile.nativeCurrency },
        {
          label: routeSectionCopy.facts.availability,
          value: stateLabels[state],
        },
      ],
    },
    comparisonScope: {
      ...routeSectionCopy.intentComparison,
      items: comparisonItems,
    },
    sourcePosture: {
      ...routeSectionCopy.intentSources,
      items: intentSourceCopyByMarket[profile.id],
    },
    limitations: {
      ...routeSectionCopy.limitations,
      items: profile.limitations,
      actions: [marketOverviewAction(profile.id), commonActions.compare],
    },
  };
}

function comparisonCell(
  marketId: MarketId,
  state: CapabilityState,
  description: string,
): ComparisonCellModel {
  return {
    marketId,
    state,
    stateLabel: stateLabels[state],
    description,
  };
}

const comparisonMatrix = {
  sectionLabel: 'Initial market capability comparison',
  eyebrow: 'Market comparison',
  heading: 'Compare evidence and workflow readiness.',
  description:
    'Statuses describe publication capability, not a numeric market result. Missing or incompatible inputs remain unavailable.',
  sectorBoundary:
    'Singapore HDB public intelligence is not combined with private residential detail.',
  tableLabel: 'Seoul, Singapore and Dubai capability comparison',
  rowHeaderLabel: 'Capability',
  columns: initialMarketIds.map((marketId) => ({
    marketId,
    label: getMarketProfile(marketId).cityName,
  })),
  rows: [
    {
      label: 'Rent evidence',
      cells: [
        comparisonCell('kr-seoul', 'available', 'Official reported rent contracts.'),
        comparisonCell('sg-singapore', 'available', 'HDB public rent intelligence only.'),
        comparisonCell(
          'ae-dubai',
          'rights_blocked',
          'Licensed transaction publication rights are not approved.',
        ),
      ],
    },
    {
      label: 'Sale evidence',
      cells: [
        comparisonCell('kr-seoul', 'available', 'Official reported sale contracts.'),
        comparisonCell('sg-singapore', 'available', 'HDB public sale intelligence only.'),
        comparisonCell(
          'ae-dubai',
          'rights_blocked',
          'Licensed transaction publication rights are not approved.',
        ),
      ],
    },
    {
      label: 'Foreign-buyer rules',
      cells: [
        comparisonCell('kr-seoul', 'limited', 'Dated source guidance is required.'),
        comparisonCell('sg-singapore', 'limited', 'Dated sector-specific guidance is required.'),
        comparisonCell('ae-dubai', 'limited', 'Dated jurisdiction guidance is required.'),
      ],
    },
    {
      label: 'Ownership costs',
      cells: [
        comparisonCell('kr-seoul', 'limited', 'Only sourced cost components can be used.'),
        comparisonCell(
          'sg-singapore',
          'limited',
          'Sector-specific sourced components are required.',
        ),
        comparisonCell('ae-dubai', 'limited', 'Rights-cleared sourced components are required.'),
      ],
    },
    {
      label: 'Yield analysis',
      cells: [
        comparisonCell('kr-seoul', 'limited', 'Complete compatible inputs are required.'),
        comparisonCell(
          'sg-singapore',
          'limited',
          'HDB inputs remain sector-specific; private detail is excluded.',
        ),
        comparisonCell(
          'ae-dubai',
          'rights_blocked',
          'Transaction inputs cannot be inferred from area or project context.',
        ),
      ],
    },
    {
      label: 'Full local workflow',
      cells: [
        comparisonCell(
          'kr-seoul',
          'limited',
          'The live Rent Explorer remains on KoreaHomeGuide during transition.',
        ),
        comparisonCell(
          'sg-singapore',
          'rights_blocked',
          'Private detail and professional connections are not active.',
        ),
        comparisonCell(
          'ae-dubai',
          'rights_blocked',
          'Transaction and professional connection gates have not passed.',
        ),
      ],
    },
  ],
} as const satisfies ComparisonMatrixModel;

export function buildComparisonPageModel(): ComparisonPageModel {
  return {
    metadata: routeMetadataCopy.compare,
    readiness: previewReadiness,
    header: routeShellCopy.header,
    footer: routeShellCopy.footer,
    hero: {
      sectionLabel: 'Market capability comparison',
      eyebrow: 'Seoul · Singapore · Dubai',
      heading: 'Compare what each market can support.',
      description:
        'Evidence, local guidance and workflow availability stay distinct from unsupported values.',
      facts: [
        { label: 'Markets', value: 'Seoul · Singapore · Dubai' },
        {
          label: 'Status language',
          value: 'available · limited · rights blocked',
        },
      ],
    },
    matrix: comparisonMatrix,
    limitations: {
      sectionLabel: 'Comparison limitations',
      eyebrow: 'Compatibility first',
      heading: 'Unknown inputs stay unknown.',
      description:
        'The comparison blocks unsupported detail instead of filling gaps or merging incompatible sectors.',
      items: [
        comparisonMatrix.sectorBoundary,
        'Native source classes remain visible and distinct.',
        'Unavailable values are never replaced with a numeric default.',
      ],
      actionsLabel: 'Available next step',
      actions: [commonActions.home],
    },
  };
}

export const notFoundPageModel = {
  metadata: routeMetadataCopy.notFound,
  header: routeShellCopy.header,
  footer: routeShellCopy.footer,
  sectionLabel: 'Page not found',
  eyebrow: 'Not found',
  heading: 'This route is not available.',
  description:
    'Browse the approved Seoul, Singapore and Dubai routes from the signedprice homepage.',
  action: commonActions.home,
} as const;
