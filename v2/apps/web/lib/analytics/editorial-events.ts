import type { ContentLocale, ContentMarketId, ContentType } from '../content/content-types';

export const EDITORIAL_EVENTS = Object.freeze([
  'article_complete',
  'article_to_explore',
  'article_to_check',
  'policy_source_open',
  'infographic_data_open',
] as const);

export type EditorialEvent = typeof EDITORIAL_EVENTS[number];
export type EditorialDestinationFamily = 'article' | 'explore' | 'check' | 'official-source' | 'infographic-data';

export type EditorialEventPayload = Readonly<{
  event: EditorialEvent;
  contentId: string;
  contentType: ContentType;
  locale: Exclude<ContentLocale, 'ko'>;
  market: ContentMarketId;
  destinationFamily?: EditorialDestinationFamily;
}>;

const contentIdentity = /^[a-z]{2}(?:-[A-Z]{2})?:[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const types = new Set<ContentType>(['news-brief', 'policy-update', 'market-brief', 'data-story', 'guide']);
const markets = new Set<ContentMarketId>(['kr-seoul', 'sg-singapore']);
const destinations = new Set<EditorialDestinationFamily>(['article', 'explore', 'check', 'official-source', 'infographic-data']);

export function createEditorialEvent(event: EditorialEvent, input: Readonly<Record<string, unknown>> & Readonly<{
  contentId: string;
  contentType: ContentType;
  locale: string;
  market: ContentMarketId;
  destinationFamily?: EditorialDestinationFamily;
}>): EditorialEventPayload {
  if (!EDITORIAL_EVENTS.includes(event)) throw new TypeError('Invalid editorial event.');
  if (!contentIdentity.test(input.contentId)) throw new TypeError('Invalid editorial content identity.');
  if (!types.has(input.contentType)) throw new TypeError('Invalid editorial content type.');
  if (input.locale !== 'en' && input.locale !== 'zh-CN') throw new TypeError('Invalid editorial locale.');
  if (!markets.has(input.market)) throw new TypeError('Invalid editorial market.');
  if (input.destinationFamily !== undefined && !destinations.has(input.destinationFamily)) {
    throw new TypeError('Invalid editorial destination family.');
  }
  return Object.freeze({
    event,
    contentId: input.contentId,
    contentType: input.contentType,
    locale: input.locale,
    market: input.market,
    ...(input.destinationFamily === undefined ? {} : { destinationFamily: input.destinationFamily }),
  });
}
