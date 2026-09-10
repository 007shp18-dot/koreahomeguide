import {
  evaluateSingleQuoteCheck,
  SINGLE_QUOTE_CHECK_PUBLICATION_MINIMUM,
  type ConversionCurve,
  type SingleQuoteCheckResult,
  type SingleQuoteComparable as CoreComparable,
} from '@signedprice/market-core';

export const SINGLE_QUOTE_PUBLICATION_MINIMUM = SINGLE_QUOTE_CHECK_PUBLICATION_MINIMUM;

export type SingleQuoteTransaction = 'sale' | 'jeonse' | 'monthly';
export type SingleQuoteHousingType = 'apartment' | 'officetel' | 'villa_multifamily' | 'detached';

export type SingleQuoteInput = Readonly<{
  transaction: SingleQuoteTransaction;
  districtSlug: string;
  buildingId: string | null;
  neighborhoodId?: string | null;
  housingType: SingleQuoteHousingType;
  areaSqm: number;
  depositWon: number | null;
  quoteWon: number;
}>;

export type SingleQuoteComparable = Readonly<{
  transaction: SingleQuoteTransaction;
  districtSlug: string;
  neighborhoodId: string;
  buildingId: string;
  housingType: SingleQuoteHousingType;
  areaSqm: number;
  filedMonth: string;
  depositWon: number | null;
  valueWon: number;
}>;

export type SingleQuoteResult = SingleQuoteCheckResult<SingleQuoteHousingType>;

export function evaluateSingleQuote(
  input: SingleQuoteInput,
  records: readonly SingleQuoteComparable[],
  period: string,
  conversionCurve?: ConversionCurve<SingleQuoteHousingType>,
): SingleQuoteResult {
  const mappedInput = Object.freeze({
    transaction: input.transaction,
    districtSlug: input.districtSlug,
    buildingId: input.buildingId,
    neighborhoodId: input.neighborhoodId ?? null,
    housingType: input.housingType,
    areaSqm: input.areaSqm,
    salePriceWon: input.transaction === 'sale' ? input.quoteWon : null,
    depositWon: input.transaction === 'sale'
      ? null
      : input.transaction === 'jeonse' ? input.quoteWon : input.depositWon,
    monthlyRentWon: input.transaction === 'monthly' ? input.quoteWon : null,
  });
  const mappedRecords: readonly CoreComparable<SingleQuoteHousingType>[] = records.map((record) => (
    Object.freeze({
      transaction: record.transaction,
      districtSlug: record.districtSlug,
      neighborhoodId: record.neighborhoodId,
      buildingId: record.buildingId,
      housingType: record.housingType,
      areaSqm: record.areaSqm,
      filedMonth: record.filedMonth,
      salePriceWon: record.transaction === 'sale' ? record.valueWon : null,
      depositWon: record.transaction === 'sale' ? null : record.depositWon,
      monthlyRentWon: record.transaction === 'monthly' ? record.valueWon : null,
    })
  ));
  return evaluateSingleQuoteCheck({
    input: mappedInput,
    records: mappedRecords,
    period,
    ...(conversionCurve === undefined ? {} : { conversionCurve }),
  });
}
