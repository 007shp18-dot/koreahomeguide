export const NEWS_SCHEMA_VERSION = 1 as const;

export type NewsMarketId = 'kr-seoul';
export type NewsLanguage = 'en';
export type NewsCategory =
  | 'official-update'
  | 'data-brief'
  | 'methodology'
  | 'correction';
export type NewsEvidenceStatus = 'verified' | 'not-confirmed' | 'not-applicable';

export type VerifiedNewsSource = Readonly<{
  publisher: string;
  title: string;
  url: string;
  publishedAt: string | null;
}>;

export type VerifiedNewsEvidence = Readonly<{
  status: NewsEvidenceStatus;
  line: string;
  artifactIds: readonly string[];
}>;

export type VerifiedNewsBlock =
  | Readonly<{ type: 'paragraph'; text: string }>
  | Readonly<{ type: 'heading'; text: string }>
  | Readonly<{ type: 'list'; items: readonly string[] }>;

export type VerifiedNewsRecord = Readonly<{
  schemaVersion: typeof NEWS_SCHEMA_VERSION;
  id: string;
  slug: string;
  marketId: NewsMarketId;
  language: NewsLanguage;
  category: NewsCategory;
  title: string;
  summary: string;
  publishedAt: string;
  updatedAt: string | null;
  source: VerifiedNewsSource;
  evidence: VerifiedNewsEvidence;
  body: readonly VerifiedNewsBlock[];
}>;

const ROOT_KEYS = [
  'schemaVersion',
  'id',
  'slug',
  'marketId',
  'language',
  'category',
  'title',
  'summary',
  'publishedAt',
  'updatedAt',
  'source',
  'evidence',
  'body',
] as const;
const SOURCE_KEYS = ['publisher', 'title', 'url', 'publishedAt'] as const;
const EVIDENCE_KEYS = ['status', 'line', 'artifactIds'] as const;
const TEXT_BLOCK_KEYS = ['type', 'text'] as const;
const LIST_BLOCK_KEYS = ['type', 'items'] as const;
const CATEGORIES = new Set<NewsCategory>([
  'official-update',
  'data-brief',
  'methodology',
  'correction',
]);
const EVIDENCE_STATUSES = new Set<NewsEvidenceStatus>([
  'verified',
  'not-confirmed',
  'not-applicable',
]);
const SAFE_IDENTIFIER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;

function invalidRecord(): never {
  throw new TypeError('Invalid verified News record.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every((key) => expected.includes(key));
}

function parseText(value: unknown, maximumLength: number): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > maximumLength ||
    value.trim() !== value ||
    CONTROL_CHARACTER.test(value)
  ) {
    invalidRecord();
  }
  return value;
}

function parseIdentifier(value: unknown): string {
  const identifier = parseText(value, 120);
  if (!SAFE_IDENTIFIER.test(identifier)) invalidRecord();
  return identifier;
}

function parseInstant(value: unknown, nullable = false): string | null {
  if (nullable && value === null) return null;
  if (typeof value !== 'string') invalidRecord();
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== value) {
    invalidRecord();
  }
  return value;
}

function parseHttpsUrl(value: unknown): string {
  const raw = parseText(value, 2_048);
  try {
    const url = new URL(raw);
    if (
      url.protocol !== 'https:' ||
      url.username !== '' ||
      url.password !== '' ||
      url.href !== raw
    ) {
      invalidRecord();
    }
  } catch {
    invalidRecord();
  }
  return raw;
}

function parseSource(value: unknown): VerifiedNewsSource {
  if (!isRecord(value) || !hasExactKeys(value, SOURCE_KEYS)) invalidRecord();
  return Object.freeze({
    publisher: parseText(value.publisher, 160),
    title: parseText(value.title, 240),
    url: parseHttpsUrl(value.url),
    publishedAt: parseInstant(value.publishedAt, true),
  });
}

function parseEvidence(value: unknown): VerifiedNewsEvidence {
  if (!isRecord(value) || !hasExactKeys(value, EVIDENCE_KEYS)) invalidRecord();
  if (!EVIDENCE_STATUSES.has(value.status as NewsEvidenceStatus)) invalidRecord();
  const status = value.status as NewsEvidenceStatus;
  const line = parseText(value.line, 320);
  if (
    !Array.isArray(value.artifactIds) ||
    value.artifactIds.length > 12 ||
    value.artifactIds.some((artifactId) => (
      typeof artifactId !== 'string' ||
      artifactId.length === 0 ||
      artifactId.length > 160 ||
      artifactId.trim() !== artifactId ||
      CONTROL_CHARACTER.test(artifactId)
    )) ||
    new Set(value.artifactIds).size !== value.artifactIds.length
  ) {
    invalidRecord();
  }
  if (
    (status === 'verified' && value.artifactIds.length === 0) ||
    (status !== 'verified' && value.artifactIds.length !== 0) ||
    (status === 'not-confirmed' && /\d/.test(line))
  ) {
    invalidRecord();
  }
  return Object.freeze({
    status,
    line,
    artifactIds: Object.freeze([...(value.artifactIds as string[])]),
  });
}

function parseBodyBlock(value: unknown): VerifiedNewsBlock {
  if (!isRecord(value) || typeof value.type !== 'string') invalidRecord();
  if (value.type === 'paragraph' || value.type === 'heading') {
    if (!hasExactKeys(value, TEXT_BLOCK_KEYS)) invalidRecord();
    return Object.freeze({
      type: value.type,
      text: parseText(value.text, value.type === 'heading' ? 160 : 2_000),
    });
  }
  if (value.type === 'list') {
    if (
      !hasExactKeys(value, LIST_BLOCK_KEYS) ||
      !Array.isArray(value.items) ||
      value.items.length === 0 ||
      value.items.length > 20
    ) {
      invalidRecord();
    }
    return Object.freeze({
      type: 'list',
      items: Object.freeze(value.items.map((item) => parseText(item, 500))),
    });
  }
  invalidRecord();
}

function parseRecord(value: unknown): VerifiedNewsRecord {
  if (!isRecord(value) || !hasExactKeys(value, ROOT_KEYS)) invalidRecord();
  if (
    value.schemaVersion !== NEWS_SCHEMA_VERSION ||
    value.marketId !== 'kr-seoul' ||
    value.language !== 'en' ||
    !CATEGORIES.has(value.category as NewsCategory) ||
    !Array.isArray(value.body) ||
    value.body.length === 0 ||
    value.body.length > 80
  ) {
    invalidRecord();
  }
  const publishedAt = parseInstant(value.publishedAt);
  const updatedAt = parseInstant(value.updatedAt, true);
  if (
    publishedAt === null ||
    (updatedAt !== null && Date.parse(updatedAt) < Date.parse(publishedAt))
  ) {
    invalidRecord();
  }
  return Object.freeze({
    schemaVersion: NEWS_SCHEMA_VERSION,
    id: parseIdentifier(value.id),
    slug: parseIdentifier(value.slug),
    marketId: 'kr-seoul',
    language: 'en',
    category: value.category as NewsCategory,
    title: parseText(value.title, 180),
    summary: parseText(value.summary, 360),
    publishedAt,
    updatedAt,
    source: parseSource(value.source),
    evidence: parseEvidence(value.evidence),
    body: Object.freeze(value.body.map(parseBodyBlock)),
  });
}

export function parseVerifiedNewsRecord(value: unknown): VerifiedNewsRecord {
  try {
    return parseRecord(value);
  } catch {
    invalidRecord();
  }
}
