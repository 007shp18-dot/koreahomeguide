export const INFOGRAPHIC_TEMPLATES = Object.freeze([
  'policy-before-after',
  'policy-timeline',
  'district-comparison',
  'market-trend',
  'cost-structure',
] as const);

export type InfographicTemplate = typeof INFOGRAPHIC_TEMPLATES[number];
export type InfographicLocale = 'en' | 'ko' | 'zh-CN';

export type InfographicDatum = Readonly<{
  label: string;
  value: number;
  evidenceReleaseId: string;
  note?: string;
}>;

export type InfographicSeries = Readonly<{
  id: string;
  label: string;
  currency?: string;
  values: readonly InfographicDatum[];
}>;

export type InfographicSpec = Readonly<{
  id: string;
  template: InfographicTemplate;
  locale: InfographicLocale;
  title: string;
  accessibleSummary: string;
  evidenceReleaseIds: readonly string[];
  unit: string;
  period: Readonly<{ start: string; end: string }>;
  series: readonly InfographicSeries[];
  sourceLabel: string;
  sampleLabel: string;
  relatedHref: string | null;
  conversionProvenance: Readonly<{
    evidenceReleaseId: string;
    note: string;
  }> | null;
}>;

export type InfographicRenderRecord = Readonly<{
  id: string;
  infographicId: string;
  rendererVersion: string;
  specHash: string;
  evidenceReleaseIds: readonly string[];
  width: number;
  height: number;
  format: 'png';
  generatedAt: string;
  objectUrl: string;
  ownership: 'owned';
}>;
