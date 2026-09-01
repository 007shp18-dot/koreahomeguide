/**
 * Authored Seoul briefs. Route code must consume these through the validated
 * server repository, never import this collection directly.
 */
export const KR_SEOUL_NEWS_RECORDS: readonly unknown[] = Object.freeze([
  Object.freeze({
    schemaVersion: 1,
    id: 'kr-seoul-coverage-2026-08-31',
    slug: 'what-the-seoul-district-snapshot-covers',
    marketId: 'kr-seoul',
    language: 'en',
    category: 'data-brief',
    title: 'What the Seoul district snapshot covers',
    summary: 'A verified note on the geographic boundary of the completed-period district evidence.',
    publishedAt: '2026-08-31T01:00:00.000Z',
    updatedAt: null,
    source: Object.freeze({
      publisher: 'Public Data Portal',
      title: 'MOLIT apartment rental transaction API',
      url: 'https://www.data.go.kr/data/15126474/openapi.do',
      publishedAt: null,
    }),
    evidence: Object.freeze({
      status: 'verified',
      line: '25 Seoul districts are included in the completed-period snapshot.',
      artifactIds: Object.freeze(['kr-seoul:2026-01/2026-07:area:v2']),
    }),
    body: Object.freeze([
      Object.freeze({
        type: 'paragraph',
        text: 'The current SignedPrice area artifact includes all 25 Seoul districts under one consistent completed-period filter. Each district remains subject to its own publication threshold.',
      }),
      Object.freeze({ type: 'heading', text: 'A complete map is not complete evidence for every metric' }),
      Object.freeze({
        type: 'paragraph',
        text: 'District coverage means the district has a place in the verified artifact. It does not override withholding: a monetary distribution is still hidden when the qualifying sample is below the publication minimum.',
      }),
    ]),
  }),
  Object.freeze({
    schemaVersion: 1,
    id: 'kr-seoul-method-2026-08-31',
    slug: 'how-signedprice-reads-reported-rental-contracts',
    marketId: 'kr-seoul',
    language: 'en',
    category: 'methodology',
    title: 'How SignedPrice reads reported rental contracts',
    summary: 'The source, publication boundary, and comparison rules behind Seoul evidence.',
    publishedAt: '2026-08-31T00:00:00.000Z',
    updatedAt: null,
    source: Object.freeze({
      publisher: 'Public Data Portal',
      title: 'MOLIT apartment rental transaction API',
      url: 'https://www.data.go.kr/data/15126474/openapi.do',
      publishedAt: null,
    }),
    evidence: Object.freeze({
      status: 'not-applicable',
      line: 'This brief explains the method and makes no market-change claim.',
      artifactIds: Object.freeze([]),
    }),
    body: Object.freeze([
      Object.freeze({
        type: 'paragraph',
        text: 'SignedPrice uses officially reported rental contracts as market evidence. It does not treat asking-price listings or anecdotal posts as completed contracts.',
      }),
      Object.freeze({ type: 'heading', text: 'What a published snapshot can answer' }),
      Object.freeze({
        type: 'list',
        items: Object.freeze([
          'How reported contracts are distributed inside one completed evidence period.',
          'How one district compares with the same filtered market boundary.',
          'Whether the available sample clears the publication threshold.',
        ]),
      }),
      Object.freeze({ type: 'heading', text: 'What it cannot answer alone' }),
      Object.freeze({
        type: 'paragraph',
        text: 'A reported-contract snapshot is not a valuation, legal opinion, future-price forecast, or proof that an individual home is fairly priced. Building condition, floor, aspect, view, renovation, and contract terms still matter.',
      }),
    ]),
  }),
]);
