import 'server-only';

import {
  createCorrectionLedger,
  type Correction,
} from '@signedprice/market-core';

const productionCorrections = createCorrectionLedger([]);

export function listCorrections(
  marketId: string,
  scope?: string,
  source: unknown = productionCorrections,
): readonly Correction[] {
  const ledger = createCorrectionLedger(source);
  return Object.freeze(ledger.filter((correction) => (
    correction.marketId === marketId
    && (scope === undefined || correction.scope === scope)
  )));
}
