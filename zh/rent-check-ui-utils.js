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
    const labels = { high:'高可信度', medium:'中等可信度', low:'较低可信度' };
    const category = isStudioMapped ? '单间回退使用的官方独栋及多户住宅分类' : '同一官方房屋分类';
    return `${labels[result.confidence] || '可信度'}：最近 ${tier.months} 个完整月份内，有 ${count} 笔同一区、${category}的成交符合面积 ±${tier.areaPct}% 和押金 ±${tier.depositPct}% 的范围。`;
  }

  function resultNextStep(rating) {
    const explore = { id:'explore_signed_rents', label:'查看近期已签约租金', href:'explore' };
    const signing = { id:'signing_questions', label:'查看签约前应问的问题', href:'/zh/guides/before-you-sign/' };
    if (rating === 'above') {
      return {
        heading:'接受这个报价之前',
        body:'签约或转账前，请先核对价格差异以及合同中需要确认的事项。',
        primary:signing,
        secondary:explore
      };
    }
    if (rating === 'below') {
      return {
        heading:'较低的报价仍需要核对合同',
        body:'先比较附近的已签约租金，再确认房东、登记簿、费用和押金保障。',
        primary:explore,
        secondary:signing
      };
    }
    if (rating === 'insufficient') {
      return {
        heading:'下一步查看更广泛的市场',
        body:'相近成交数量不足，无法给出判断；请先查看近期已签约租金。',
        primary:explore,
        secondary:signing
      };
    }
    return {
      heading:'价格接近市场水平，下一步核对合同',
      body:'价格看起来合理，并不代表房东、登记簿、费用或押金保障已经确认。',
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

  function hasDistribution(result) {
    return Boolean(result && result.rating !== 'insufficient' &&
      [result.p25ValueWon, result.p75ValueWon, result.percentileRank]
        .every(value => value !== null && value !== undefined && Number.isFinite(Number(value))));
  }

  function percentileSentence(result) {
    if (!hasDistribution(result)) return '';
    const subject = result.comparisonMode === 'jeonse-deposit' ? '这笔全租押金' : '这个报价';
    const rank = Math.round(Number(result.percentileRank));
    if (rank >= 99) return `${subject}处于或接近这组可比成交的最高水平。`;
    if (rank <= 0) return `${subject}处于或接近这组可比成交的最低水平。`;
    return `${subject}约处于可比已签约成交的第 ${Math.round(Number(result.percentileRank))} 百分位。`;
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
