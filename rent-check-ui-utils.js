(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGRentCheckUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const UPSTREAM_MESSAGE = 'Official transaction data is temporarily unavailable. Please try again shortly.';

  function ratingLabel(rating, verdictBasis) {
    if (verdictBasis === 'median-fallback') {
      return {
        above: 'Above sample median',
        fair: 'Near sample median',
        below: 'Below sample median'
      }[rating] || 'Rent check';
    }
    return {
      above: 'Above market',
      fair: 'Typical range',
      below: 'Below market',
      insufficient: 'Not enough comparable data'
    }[rating] || 'Rent check';
  }

  function confidenceLabel(confidence) {
    return {
      high: 'Strong sample',
      medium: 'Moderate sample',
      low: 'Limited sample'
    }[confidence] || '';
  }

  function confidenceQuestion(result) {
    return {
      high: 'Why is this a strong sample?',
      medium: 'Why is this a moderate sample?',
      low: 'Why is this a limited sample?'
    }[result && result.confidence] || 'Why this sample strength?';
  }

  const MATCH_TIERS = Object.freeze({
    1:{ months:3, areaPct:15, depositPct:25 },
    2:{ months:6, areaPct:20, depositPct:35 },
    3:{ months:12, areaPct:25, depositPct:50 }
  });
  const MARKET_DISTRICTS = Object.freeze({
    '11680':'gangnam-gu','11440':'mapo-gu','11170':'yongsan-gu','11200':'seongdong-gu',
    '11560':'yeongdeungpo-gu','11620':'gwanak-gu','11230':'dongdaemun-gu','11410':'seodaemun-gu',
    '11290':'seongbuk-gu','11215':'gwangjin-gu','11650':'seocho-gu','11710':'songpa-gu',
    '11740':'gangdong-gu','11110':'jongno-gu','11140':'jung-gu'
  });
  const DISTRICT_CODES = new Set(Object.keys(MARKET_DISTRICTS));
  const PROPERTY_TYPES = new Set(['apartment','officetel','villa','detached']);
  const MARKET_PROPERTY_TYPES = new Set(['apartment','officetel','villa']);

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
        primary:explore
      };
    }
    if (rating === 'below') {
      return {
        heading:'A lower quote still needs contract checks',
        body:'Compare nearby signed rents, then verify the owner, registry, fees, and deposit protection before paying.',
        primary:signing
      };
    }
    if (rating === 'insufficient') {
      return {
        heading:'Compare the broader market next',
        body:'There were too few close matches for a verdict, so review recent signed rents before deciding.',
        primary:{ id:'open_market_page', label:'Open the broader market view', href:'market' }
      };
    }
    return {
      heading:'Price looks close—check the contract next',
      body:'A fair-looking price does not verify the owner, registry, fees, or deposit protection.',
      primary:signing
    };
  }

  function verdictPresentation(result) {
    const rating = result && result.rating || 'insufficient';
    const count = Math.max(0, Math.round(Number(result && result.comparableCount || 0)));
    const difference = Number(result && result.differencePct);
    return {
      icon:{ above:'↑', fair:'✓', below:'↓', insufficient:'?' }[rating] || '?',
      label:ratingLabel(rating,result && result.verdictBasis),
      difference:rating === 'insufficient' || !Number.isFinite(difference)
        ? 'No price verdict from this sample'
        : `${difference > 0 ? '+' : ''}${difference.toFixed(1)}% vs comparable median`,
      sample:`Based on ${count} signed contract${count === 1 ? '' : 's'}`
    };
  }

  function marketPageUrl(lawdCd, propertyType, language) {
    const district = MARKET_DISTRICTS[String(lawdCd || '')];
    const type = String(propertyType || '');
    if (!district || !MARKET_PROPERTY_TYPES.has(type)) return null;
    const prefix = String(language || '').toLowerCase().startsWith('zh') ? '/zh' : '';
    return `${prefix}/rent/${district}/${type}/`;
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
    const magnitude = Math.abs(Number(result.differencePct || 0));
    const pct = magnitude.toFixed(1);
    const isJeonse = result.comparisonMode === 'jeonse-deposit';
    const subject = isJeonse ? 'This jeonse deposit' : 'This quote';
    if (result.verdictBasis === 'median-fallback') {
      if (result.rating === 'above') return `With limited data, ${subject.toLowerCase()} is ${pct}% above the sample median; the fallback threshold is 10%.`;
      if (result.rating === 'below') return `With limited data, ${subject.toLowerCase()} is ${pct}% below the sample median; the fallback threshold is 10%.`;
      return `With limited data, ${subject.toLowerCase()} is within 10% of the sample median.`;
    }
    if (result.rating === 'above' && magnitude < 0.05) return `${subject} is slightly above the recent comparable median.`;
    if (result.rating === 'below' && magnitude < 0.05) return `${subject} is slightly below the recent comparable median.`;
    if (result.rating === 'above') return `${subject} is ${pct}% above the recent comparable median.`;
    if (result.rating === 'below') return `${subject} is ${pct}% below the recent comparable median.`;
    if (result.verdictBasis === 'typical-range') {
      return isJeonse
        ? 'This jeonse deposit sits within the typical range of recent comparable contracts.'
        : 'This quote sits within the typical range of recent comparable contracts.';
    }
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

  function isNumericValue(value) {
    return value !== null && value !== undefined && value !== '' && typeof value !== 'boolean' && Number.isFinite(Number(value));
  }

  function hasDistribution(result) {
    if (!result || !['below','fair','above'].includes(result.rating)) return false;
    const rawValues = [result.p25ValueWon, result.p75ValueWon, result.percentileRank];
    if (!rawValues.every(isNumericValue)) return false;
    const p25 = Number(result.p25ValueWon);
    const p75 = Number(result.p75ValueWon);
    const rank = Number(result.percentileRank);
    return p25 >= 0 && p75 >= p25 && rank >= 0 && rank <= 100;
  }

  function marketPositionModel(result) {
    if (!result || !['below','fair','above'].includes(result.rating)) return null;
    const rawValues = [result.p25ValueWon, result.p75ValueWon, result.askingValueWon];
    if (!rawValues.every(isNumericValue)) return null;
    const p25 = Number(result.p25ValueWon);
    const p75 = Number(result.p75ValueWon);
    const asking = Number(result.askingValueWon);
    if ([p25, p75, asking].some(value => value < 0) || p25 > p75) return null;
    const relation = asking < p25 ? 'below' : asking > p75 ? 'above' : 'within';
    const expectedRating = relation === 'within' ? 'fair' : relation;
    if (result.rating !== expectedRating) return null;
    const gapWon = relation === 'below' ? p25 - asking : relation === 'above' ? asking - p75 : 0;
    const spread = Math.max(p75 - p25, Math.max(p25, p75) * .1, 1);
    let quotePct = 50;
    if (relation === 'within' && p75 > p25) quotePct = 28 + ((asking - p25) / (p75 - p25)) * 44;
    if (relation === 'below') quotePct = 28 - Math.min(24, (gapWon / spread) * 24);
    if (relation === 'above') quotePct = 72 + Math.min(24, (gapWon / spread) * 24);
    quotePct = Math.round(quotePct * 10) / 10;
    if (relation === 'below') quotePct = Math.min(26, quotePct);
    if (relation === 'above') quotePct = Math.max(74, quotePct);
    return { quotePct, relation, gapWon };
  }

  function marketPositionSummary(model) {
    if (!model) return '';
    if (model.relation === 'above') return 'above the upper end of the typical range';
    if (model.relation === 'below') return 'below the lower end of the typical range';
    return 'inside the typical range';
  }

  function evidenceFacts(result) {
    const rawCount = result && result.comparableCount;
    const rawMonths = result && result.monthsUsed;
    const count = isNumericValue(rawCount) ? Math.max(0, Math.round(Number(rawCount))) : 0;
    const months = isNumericValue(rawMonths) ? Math.max(1, Math.round(Number(rawMonths))) : 12;
    const rate = Number(result && result.conversionAnnualRate);
    return {
      sampleLabel:`${count} signed contract${count === 1 ? '' : 's'}`,
      periodLabel:`Latest ${months} completed month${months === 1 ? '' : 's'}`,
      ...(result && result.comparisonMode === 'monthly-rent' && Number.isFinite(rate)
        ? { methodLabel:`Monthly rents normalized to your deposit at ${(rate * 100).toFixed(1)}%/year statutory reference` }
        : {})
    };
  }

  function comparableDisclosure(total, expanded) {
    const count = Math.max(0, Math.round(Number(total || 0)));
    if (count <= 3) return { showToggle:false, hiddenCount:0, label:'' };
    return {
      showToggle:true,
      hiddenCount:expanded ? 0 : count - 3,
      label:expanded ? 'Show fewer comparison rows' : `Show all ${count} comparison rows`
    };
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
    confidenceQuestion,
    confidenceExplanation,
    resultNextStep,
    verdictPresentation,
    marketPageUrl,
    explorerUrl,
    mapRentCheckType,
    resultSentence,
    humanizeRentCheckError,
    formatWon,
    formatDifference,
    hasDistribution,
    marketPositionModel,
    marketPositionSummary,
    evidenceFacts,
    comparableDisclosure,
    percentileSentence
  };
});
