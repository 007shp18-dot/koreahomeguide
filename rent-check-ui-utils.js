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

  function mapRentCheckType(type) {
    if (type === 'studio') return { officialType: 'villa', isStudioMapped: true };
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

  return {
    UPSTREAM_MESSAGE,
    ratingLabel,
    confidenceLabel,
    mapRentCheckType,
    resultSentence,
    humanizeRentCheckError,
    formatWon,
    formatDifference
  };
});
