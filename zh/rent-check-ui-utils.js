(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGRentCheckUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const UPSTREAM_MESSAGE = '官方租赁成交数据暂时无法使用，请稍后再试。';

  function ratingLabel(rating) {
    return {
      above: '高于近期成交水平',
      fair: '价格合理',
      below: '低于近期成交水平',
      insufficient: '可比成交数据不足'
    }[rating] || '租金检查';
  }

  function confidenceLabel(confidence) {
    return {
      high: '可信度高',
      medium: '可信度中等',
      low: '可信度较低'
    }[confidence] || '';
  }

  function mapRentCheckType(type) {
    if (type === 'studio') return { officialType: 'villa', isStudioMapped: true };
    return { officialType: type, isStudioMapped: false };
  }

  function resultSentence(result) {
    if (!result || result.rating === 'insufficient') {
      return '相似的官方成交记录不足，暂时无法做出可靠判断。';
    }
    const pct = Math.abs(Number(result.differencePct || 0)).toFixed(1);
    const isJeonse = result.comparisonMode === 'jeonse-deposit';
    const subject = isJeonse ? '这笔全租（Jeonse）押金' : '这个报价';
    if (result.rating === 'above') return `${subject}比近期可比成交中位数高 ${pct}%。`;
    if (result.rating === 'below') return `${subject}比近期可比成交中位数低 ${pct}%。`;
    return isJeonse
      ? '这笔全租（Jeonse）押金接近近期可比成交水平。'
      : '这个报价接近近期可比成交水平。';
  }

  function humanizeRentCheckError(message) {
    const text = String(message || '').trim();
    if (!text) return UPSTREAM_MESSAGE;
    if (/public api|http\s*\d{3}|failed to fetch|network|temporarily unavailable|failed to reach|upstream|rent comparison is temporarily unavailable/i.test(text)) {
      return UPSTREAM_MESSAGE;
    }
    if (/deposit/i.test(text)) return '请输入有效的押金金额。';
    if (/monthly rent|rent/i.test(text)) return '请输入有效的月租金额。';
    if (/area|size/i.test(text)) return '请输入有效的房屋面积。';
    return UPSTREAM_MESSAGE;
  }

  function formatWon(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '-';
    return `₩${Math.round(amount).toLocaleString('zh-CN')}`;
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
