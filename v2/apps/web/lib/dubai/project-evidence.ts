export type DubaiProjectEvidence = Readonly<{
  id: string;
  projectNumber: string;
  areaSlug: string;
  name: string;
  housing: 'apartment' | 'villa';
  stage: 'ready' | 'off-plan';
  n: number;
  medianPriceAed: number;
  medianPricePerSqmAed: number;
}>;
