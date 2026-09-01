// Net proceeds — what a seller actually walks away with.
//
// The gap this closes: people track how much their home went up, and almost
// nobody tracks how much of that reaches them. The money already committed —
// the outstanding loan and, in Korea, the tenant's deposit — usually dwarfs the
// gain, and both are exactly knowable. So this module computes the exact lines
// exactly, and refuses to pretend about the one line that is genuinely hard.
//
// 양도소득세 is that line. It turns on how many homes the household owns, how
// long it was held and lived in, the 장기보유특별공제, and whether the home is
// in a 조정대상지역 — none of which this module can see. It is therefore an
// INPUT with a rough default, flagged on screen as the line most likely to be
// wrong, and never presented as a computed result.

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.NetProceeds = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  const EOK = 1e8;

  // 주택 매매 중개보수 상한요율 (공인중개사법 시행규칙 별표). These are CAPS the
  // parties negotiate under, charged to buyer and seller separately — not fixed
  // prices. The UI must say so, or it quietly overstates the cost.
  const BROKER_BANDS = Object.freeze([
    { under: 0.5 * EOK, rate: 0.006, cap: 250000 },
    { under: 2 * EOK,   rate: 0.005, cap: 800000 },
    { under: 9 * EOK,   rate: 0.004, cap: null },
    { under: 12 * EOK,  rate: 0.005, cap: null },
    { under: 15 * EOK,  rate: 0.006, cap: null },
    { under: Infinity,  rate: 0.007, cap: null }
  ]);

  function brokerageCap(priceWon) {
    const p = Number(priceWon);
    if (!(p > 0)) return { won: 0, rate: 0, capped: false };
    const band = BROKER_BANDS.find(b => p < b.under) || BROKER_BANDS[BROKER_BANDS.length - 1];
    const raw = p * band.rate;
    const won = band.cap != null ? Math.min(raw, band.cap) : raw;
    return { won: Math.round(won), rate: band.rate, capped: band.cap != null && raw > band.cap };
  }

  // A deliberately crude 양도소득세 starting point, used only to prefill the
  // input. Single-home households under the 12억 threshold that meet the holding
  // and residence conditions are exempt, which is the common case; everything
  // else gets a flat share of the gain that the user is expected to replace.
  function defaultCapitalGainsTax({ priceWon, purchaseWon, singleHomeExempt }) {
    const gain = Number(priceWon) - Number(purchaseWon);
    if (!(gain > 0)) return 0;
    if (singleHomeExempt && Number(priceWon) <= 12 * EOK) return 0;
    return Math.round(gain * 0.22); // rough: mid-bracket + 지방소득세, replace with your case
  }

  // Every line is either exact or an input. Nothing is hidden inside the total.
  function compute(input) {
    const n = v => { const x = Number(v); return Number.isFinite(x) && x > 0 ? x : 0; };
    const price = n(input.priceWon);
    const loan = n(input.loanWon);
    const deposit = n(input.tenantDepositWon);
    const brokerage = input.brokerageWon != null ? n(input.brokerageWon) : brokerageCap(price).won;
    const tax = input.capitalGainsTaxWon != null
      ? n(input.capitalGainsTaxWon)
      : defaultCapitalGainsTax({
          priceWon: price, purchaseWon: n(input.purchaseWon),
          singleHomeExempt: input.singleHomeExempt !== false
        });
    const legal = input.legalWon != null ? n(input.legalWon) : 300000;

    const deductions = loan + deposit + brokerage + tax + legal;
    const net = price - deductions;
    const gain = price - n(input.purchaseWon);

    return {
      price, loan, deposit, brokerage, tax, legal,
      deductions, net, gain,
      // Share of the SALE PRICE that reaches the seller. Comparing net proceeds
      // against the gain instead would be nonsense — net proceeds also return
      // the equity the seller already had, so that ratio runs well over 100%
      // and means nothing.
      keptShareOfPrice: price > 0 ? net / price : null,
      // The case worth calling out: the money already committed is so large
      // that the seller walks away with less cash than the home gained.
      netBelowGain: gain > 0 && net < gain,
      brokerageIsCap: input.brokerageWon == null,
      taxIsDefault: input.capitalGainsTaxWon == null
    };
  }

  return { EOK, BROKER_BANDS, brokerageCap, defaultCapitalGainsTax, compute };
});
