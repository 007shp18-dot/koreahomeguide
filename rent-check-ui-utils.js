(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGRentCheckUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const UPSTREAM_MESSAGE = 'Official transaction data is temporarily unavailable. Please try again shortly.';

  function ratingLabel(rating) {
    return {
      above: 'Above market',
      fair: 'Fair',
      below: 'Below market',
      insufficient: 'Not enough comparable data'
    }[rating] || 'Rent check';
  }

  function confidenceLabel(confidence) {
    return {
      high: 'High confidence',
      medium: 'Medium confidence',
      low: 'Low confidence'
    }[confidence] || '';
  }

  const MATCH_TIERS = Object.freeze({
    1:{ months:3, areaPct:15, depositPct:25 },
    2:{ months:6, areaPct:20, depositPct:35 },
    3:{ months:12, areaPct:25, depositPct:50 }
  });
  const DISTRICT_CODES = new Set(['11680','11200','11440','11170','11560','11620','11230','11410','11290','11215']);
  const PROPERTY_TYPES = new Set(['apartment','officetel','villa','detached']);

  function confidenceExplanation(result, isStudioMapped = false) {
    if (!result || !result.confidence) return '';
    const tier = MATCH_TIERS[Number(result.tier)];
    const count = Math.max(0, Math.round(Number(result.comparableCount || 0)));
    if (!tier || !count) return '';
    const category = isStudioMapped
      ? 'the official detached/multi-unit category used as the studio fallback'
      : 'the same official property category';
    return `${confidenceLabel(result.confidence)}: ${count} contracts matched the same district and ${category} within ±${tier.areaPct}% size and ±${tier.depositPct}% deposit across the latest ${tier.months} completed months.`;
  }

  function resultNextStep(rating) {
    const explore = { id:'explore_signed_rents', label:'Explore recent signed rents', href:'explore' };
    const signing = { id:'signing_questions', label:'Review questions before signing', href:'/guides/before-you-sign/' };
    if (rating === 'above') {
      return {
        heading:'Before you accept this quote',
        body:'Review the price difference and the contract checks that matter before you sign or transfer money.',
        primary:signing,
        secondary:explore
      };
    }
    if (rating === 'below') {
      return {
        heading:'A lower quote still needs contract checks',
        body:'Compare nearby signed rents, then verify the owner, registry, fees, and deposit protection before paying.',
        primary:explore,
        secondary:signing
      };
    }
    if (rating === 'insufficient') {
      return {
        heading:'Compare the broader market next',
        body:'There were too few close matches for a verdict, so review recent signed rents before deciding.',
        primary:explore,
        secondary:signing
      };
    }
    return {
      heading:'Price looks close—check the contract next',
      body:'A fair-looking price does not verify the owner, registry, fees, or deposit protection.',
      primary:explore,
      secondary:signing
    };
  }

  function explorerUrl(lawdCd, propertyType, language) {
    const base = String(language || '').toLowerCase().startsWith('zh') ? '/zh/explore/' : '/explore/';
    const district = String(lawdCd || '');
    const type = String(propertyType || '');
    if (!DISTRICT_CODES.has(district) || !PROPERTY_TYPES.has(type)) return base;
    return `${base}?${new URLSearchParams({ lawdCd:district, type }).toString()}`;
  }

  function mapRentCheckType(type) {
    if (type === 'studio') return { officialType: 'detached', isStudioMapped: true };
    return { officialType: type, isStudioMapped: false };
  }

  function resultSentence(result) {
    if (!result || result.rating === 'insufficient') {
      return 'There are not enough similar official contracts to make a reliable comparison.';
    }
    const pct = Math.abs(Number(result.differencePct || 0)).toFixed(1);
    const isJeonse = result.comparisonMode === 'jeonse-deposit';
    const subject = isJeonse ? 'This jeonse deposit' : 'This quote';
    if (result.rating === 'above') return `${subject} is ${pct}% above recent comparable contracts.`;
    if (result.rating === 'below') return `${subject} is ${pct}% below recent comparable contracts.`;
    return isJeonse
      ? 'This jeonse deposit is close to recent comparable contracts.'
      : 'This quote is close to recent comparable contracts.';
  }

  function humanizeRentCheckError(message) {
    const text = String(message || '').trim();
    if (!text) return UPSTREAM_MESSAGE;
    if (/public api|http\s*\d{3}|failed to fetch|network|temporarily unavailable|failed to reach|upstream|rent comparison is temporarily unavailable/i.test(text)) {
      return UPSTREAM_MESSAGE;
    }
    return text;
  }

  function formatWon(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '-';
    return `₩${Math.round(amount).toLocaleString('en-US')}`;
  }

  function formatDifference(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '-';
    return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
  }

  function ordinal(value) {
    const n = Math.max(0, Math.min(100, Math.round(Number(value))));
    const mod100 = n % 100;
    const suffix = mod100 >= 11 && mod100 <= 13
      ? 'th'
      : ({ 1:'st', 2:'nd', 3:'rd' }[n % 10] || 'th');
    return `${n}${suffix}`;
  }

  function hasDistribution(result) {
    return Boolean(result && result.rating !== 'insufficient' &&
      [result.p25ValueWon, result.p75ValueWon, result.percentileRank]
        .every(value => value !== null && value !== undefined && Number.isFinite(Number(value))));
  }

  function percentileSentence(result) {
    if (!hasDistribution(result)) return '';
    const subject = result.comparisonMode === 'jeonse-deposit'
      ? 'This jeonse deposit'
      : 'This quote';
    const rank = Math.round(Number(result.percentileRank));
    if (rank >= 99) return `${subject} is at or near the top of this comparable set.`;
    if (rank <= 0) return `${subject} is at or near the bottom of this comparable set.`;
    return `${subject} is around the ${ordinal(result.percentileRank)} percentile of comparable signed contracts.`;
  }

  return {
    UPSTREAM_MESSAGE,
    ratingLabel,
    confidenceLabel,
    confidenceExplanation,
    resultNextStep,
    explorerUrl,
    mapRentCheckType,
    resultSentence,
    humanizeRentCheckError,
    formatWon,
    formatDifference,
    hasDistribution,
    percentileSentence
  };
});
