export type GuideLink = Readonly<{ label: string; href: string }>;
export type GuideStep = Readonly<{ title: string; body: string }>;

export type GuideDocument = Readonly<{
  slug: 'compare-two-contracts' | 'read-district-evidence' | 'understand-publication-limits';
  title: string;
  summary: string;
  stage: 'Before signing' | 'Market research' | 'Evidence check';
  readMinutes: 3 | 4;
  lastVerified: string;
  steps: readonly GuideStep[];
  evidenceBoundary: string;
  links: readonly GuideLink[];
}>;

function freezeGuide(guide: GuideDocument): GuideDocument {
  return Object.freeze({
    ...guide,
    steps: Object.freeze(guide.steps.map((step) => Object.freeze({ ...step }))),
    links: Object.freeze(guide.links.map((link) => Object.freeze({ ...link }))),
  });
}

export const GUIDES = Object.freeze([
  freezeGuide({
    slug: 'compare-two-contracts',
    title: 'Compare two rental contracts on one basis',
    summary: 'Use the same housing type and verified conversion evidence to compare deposit-and-rent offers.',
    stage: 'Before signing',
    readMinutes: 4,
    lastVerified: '2026-08-31',
    steps: [
      { title: 'Confirm like-for-like inputs', body: 'Enter both offers in the same currency and housing type. Keep optional labels descriptive.' },
      { title: 'Read the applied rate state', body: 'Check whether the rate is interpolated between verified anchors or held at an observed boundary.' },
      { title: 'Use the verdict as decision support', body: 'The result compares monthly burden under one evidence method. It does not replace contract, legal, or financing review.' },
    ],
    evidenceBoundary: 'The comparison uses a verified conversion curve from matched reported contracts. It is not a forecast, appraisal, or promise of an obtainable rate.',
    links: [
      { label: 'Open Contract Check', href: '/kr/' },
      { label: 'Explore district evidence', href: '/kr/seoul/explore/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'read-district-evidence',
    title: 'Read Seoul district evidence without overclaiming',
    summary: 'Interpret median, middle half, range, recent comparison, and sample depth within one fixed filter.',
    stage: 'Market research',
    readMinutes: 3,
    lastVerified: '2026-08-31',
    steps: [
      { title: 'Start with the fixed scope', body: 'Check the district, completed period, filed-area band, deal filter, and included contract states before comparing figures.' },
      { title: 'Separate position from quality', body: 'A median locates the middle reported contract. A wider middle half describes dispersion, not legal safety or home condition.' },
      { title: 'Use links to inspect context', body: 'Open the district document, nearby districts, rankings definitions, source boundary, and correction ledger together.' },
    ],
    evidenceBoundary: 'District summaries describe qualifying reported contracts in a completed period. They are not current listings, individual-home valuations, or neighbourhood quality scores.',
    links: [
      { label: 'Open District Explorer', href: '/kr/seoul/explore/' },
      { label: 'View district rankings', href: '/kr/seoul/rankings/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'understand-publication-limits',
    title: 'Understand publication limits and refusals',
    summary: 'Treat withheld, unavailable, not-loaded, and rights-blocked states as evidence about the boundary.',
    stage: 'Evidence check',
    readMinutes: 3,
    lastVerified: '2026-08-31',
    steps: [
      { title: 'Read the state before the figure', body: 'A published figure requires validated data, confirmed display rights, a completed period, and the stated minimum sample.' },
      { title: 'Do not substitute a broader number', body: 'When district or building evidence is unavailable, SignedPrice does not fill the gap with a city value or a UI fixture.' },
      { title: 'Check corrections and freshness', body: 'Use the generated time, method identifier, rights identifier, source boundary, and correction ledger to assess the evidence.' },
    ],
    evidenceBoundary: 'A refusal state explains why a value is absent. It does not imply that the market or property itself lacks activity, quality, or value.',
    links: [
      { label: 'Read SignedPrice Trust', href: '/trust/' },
      { label: 'Review Seoul corrections', href: '/kr/seoul/corrections/' },
      { label: 'Return to District Explorer', href: '/kr/seoul/explore/' },
    ],
  }),
] as const);

export type GuideGlossaryEntry = Readonly<{
  term: string;
  definition: string;
  whyItMatters: string;
}>;

export const GUIDE_GLOSSARY = Object.freeze([
  { term: 'reported contract', definition: 'A transaction or rental contract included by the named official dataset and fixed filters.', whyItMatters: 'It is evidence of a reported agreement, not an asking listing.' },
  { term: 'median', definition: 'The middle value after eligible observations are ordered.', whyItMatters: 'It is less dominated by extremes than an arithmetic average, but still depends on scope.' },
  { term: 'middle half', definition: 'The interval from the lower quartile to the upper quartile.', whyItMatters: 'It shows central dispersion without claiming a fair-price band.' },
  { term: 'publication minimum', definition: 'The smallest qualifying sample SignedPrice permits before showing monetary distribution fields.', whyItMatters: 'It prevents thin samples from appearing more precise than they are.' },
  { term: 'withheld', definition: 'A valid evidence record whose monetary fields are not published under the stated rule.', whyItMatters: 'The absence is intentional and must not be replaced with a broader value.' },
  { term: 'conversion curve', definition: 'Verified anchor rates used to place different deposit-and-rent offers on one comparison basis.', whyItMatters: 'The applied rate can be interpolated or held at an observed boundary.' },
  { term: 'completed period', definition: 'A closed reporting interval named by the artifact rather than a live listing window.', whyItMatters: 'The evidence describes that interval and should not be read as a real-time quote.' },
  { term: 'correction', definition: 'A published ledger entry that records a fixed or upheld challenge to evidence.', whyItMatters: 'It makes material evidence changes reviewable instead of silently rewriting history.' },
].map((entry) => Object.freeze(entry)));

export function getGuideBySlug(slug: string): GuideDocument | null {
  return GUIDES.find((guide) => guide.slug === slug) ?? null;
}
