import 'server-only';

import {
  parseKoreaConversionArtifact,
  toBrowserConversionCurves,
  type KoreaConversionArtifactExpectation,
  type KoreaConversionCurveProjection,
  type KoreaConversionHousingType,
} from '@signedprice/korea-rent';

export type ConversionRepository = Readonly<{
  listCurves(): readonly KoreaConversionCurveProjection[];
  getCurve(housingType: KoreaConversionHousingType): KoreaConversionCurveProjection;
}>;

export class ConversionEvidenceUnavailableError extends Error {
  readonly code = 'conversion_evidence_unavailable' as const;

  constructor() {
    super('Verified conversion evidence is unavailable.');
    this.name = 'ConversionEvidenceUnavailableError';
  }
}

export function createConversionRepository(input: Readonly<{
  source: unknown;
  expected: KoreaConversionArtifactExpectation;
  referenceInstant: string;
}>): ConversionRepository {
  try {
    const artifact = parseKoreaConversionArtifact(
      input.source,
      input.expected,
      input.referenceInstant,
    );
    const curves = toBrowserConversionCurves(artifact);
    const byHousingType = new Map(
      curves.map((curve) => [curve.housingType, curve] as const),
    );
    return Object.freeze({
      listCurves(): readonly KoreaConversionCurveProjection[] {
        return curves;
      },
      getCurve(housingType: KoreaConversionHousingType): KoreaConversionCurveProjection {
        const curve = byHousingType.get(housingType);
        if (curve === undefined) throw new ConversionEvidenceUnavailableError();
        return curve;
      },
    });
  } catch (error) {
    if (error instanceof ConversionEvidenceUnavailableError) throw error;
    throw new ConversionEvidenceUnavailableError();
  }
}
