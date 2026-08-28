(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGRentCheckUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const UPSTREAM_MESSAGE = '官方租赁成交数据暂时无法使用，请稍后再试。';

  function ratingLabel(rating, verdictBasis) {
    if (verdictBasis === 'median-fallback') {
      return {
        above: '高于样本中位数',
        fair: '接近样本中位数',
        below: '低于样本中位数'
      }[rating] || '租金检查';
    }
    return {
      above: '高于近期成交水平',
      fair: '典型区间',
      below: '低于近期成交水平',
      insufficient: '可比成交数据不足'
    }[rating] || '租金检查';
  }

  function confidenceLabel(confidence) {
    return {
      high: '样本充分',
      medium: '样本一般',
      low: '样本有限'
    }[confidence] || '';
  }

  function confidenceQuestion(result) {
    return {
      high: '为什么这组样本充分？',
      medium: '为什么这组样本一般？',
      low: '为什么这组样本有限？'
    }[result && result.confidence] || '为什么是这个样本强度？';
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
    const labels = { high:'样本充分', medium:'样本一般', low:'样本有限' };
    const category = isStudioMapped ? '单间回退使用的官方独栋及多户住宅分类' : '同一官方房屋分类';
    return `${labels[result.confidence] || '可信度'}：最近 ${tier.months} 个完整月份内，有 ${count} 笔同一区、${category}的成交符合面积 ±${tier.areaPct}% 和押金 ±${tier.depositPct}% 的范围。`;
  }

  function resultNextStep(rating) {
    const explore = { id:'explore_signed_rents', label:'查看附近已签约租金', href:'explore' };
    const signing = { id:'signing_questions', label:'查看签约前清单', href:'/zh/guides/before-you-sign/' };
    if (rating === 'above') {
      return {
        heading:'决定前再核对一下价格',
        body:'这个报价高于近期可比区间。接受前，可先查看附近的已签约租金。',
        primary:explore
      };
    }
    if (rating === 'below') {
      return {
        heading:'价格低，合同也要查',
        body:'付款前，请确认房东、登记簿、费用和押金保障。',
        primary:signing
      };
    }
    if (rating === 'insufficient') {
      return {
        heading:'相近成交还不够',
        body:'先查看更广泛的市场；如果知道登记房屋类型，也可以换成该类型再检查一次。',
        primary:{ id:'open_market_page', label:'查看更广泛的市场', href:'market' }
      };
    }
    return {
      heading:'下一步核对合同',
      body:'价格接近近期可比成交。接下来请确认房东、登记簿、费用和押金保障。',
      primary:signing
    };
  }

  function verdictPresentation(result) {
    const rating = result && result.rating || 'insufficient';
    const count = Math.max(0, Math.round(Number(result && result.comparableCount || 0)));
    const difference = Number(result && result.differencePct);
    const hasDifference = rating !== 'insufficient' && Number.isFinite(difference);
    return {
      icon:{ above:'▲', fair:'●', below:'▼', insufficient:'─' }[rating] || '─',
      label:ratingLabel(rating,result && result.verdictBasis),
      difference:hasDifference ? `${difference >= 0 ? '+' : '−'}${Math.abs(difference).toFixed(1)}%` : '—',
      comparison:hasDifference ? '与可比成交中位数相比' : '当前样本无法给出价格判断',
      sample:`${count} 笔已签约成交`
    };
  }

  function distributionCopy() {
    return {
      title:'近期可比成交区间',
      subtitle:'可比已签约成交中间 50% 的价格范围',
      rangeLabel:'中间 50%（P25–P75）',
      positionLabel:'这个报价的位置'
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
      return '相似的官方成交记录不足，暂时无法做出可靠判断。';
    }
    const magnitude = Math.abs(Number(result.differencePct || 0));
    const pct = magnitude.toFixed(1);
    const isJeonse = result.comparisonMode === 'jeonse-deposit';
    const subject = isJeonse ? '这笔全租（Jeonse）押金' : '这个报价';
    if (result.verdictBasis === 'median-fallback') {
      if (result.rating === 'above') return `样本有限时，${subject}比样本中位数高 ${pct}%；回退判断阈值为 10%。`;
      if (result.rating === 'below') return `样本有限时，${subject}比样本中位数低 ${pct}%；回退判断阈值为 10%。`;
      return `样本有限时，${subject}在样本中位数的 ±10% 范围内。`;
    }
    if (result.rating === 'above' && magnitude < 0.05) return `${subject}略高于近期可比成交中位数。`;
    if (result.rating === 'below' && magnitude < 0.05) return `${subject}略低于近期可比成交中位数。`;
    if (result.rating === 'above') return `${subject}比近期可比成交中位数高 ${pct}%。`;
    if (result.rating === 'below') return `${subject}比近期可比成交中位数低 ${pct}%。`;
    if (result.verdictBasis === 'typical-range') {
      return isJeonse
        ? '这笔全租（Jeonse）押金位于近期可比成交的典型区间内。'
        : '这个报价位于近期可比成交的典型区间内。';
    }
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

  function distributionModel(result) {
    if (!hasDistribution(result)) return null;
    const position = marketPositionModel(result);
    const median = Number(result.medianValueWon);
    if (!position || !isNumericValue(result.medianValueWon) || median < Number(result.p25ValueWon) || median > Number(result.p75ValueWon)) return null;
    return {
      p25ValueWon:Number(result.p25ValueWon),
      medianValueWon:median,
      p75ValueWon:Number(result.p75ValueWon),
      percentileRank:Math.round(Number(result.percentileRank)),
      ...position
    };
  }

  function marketPositionSummary(model) {
    if (!model) return '';
    if (model.relation === 'above') return '比典型区间上限高';
    if (model.relation === 'below') return '比典型区间下限低';
    return '处于典型区间内';
  }

  function evidenceFacts(result) {
    const rawCount = result && result.comparableCount;
    const rawMonths = result && result.monthsUsed;
    const count = isNumericValue(rawCount) ? Math.max(0, Math.round(Number(rawCount))) : 0;
    const months = isNumericValue(rawMonths) ? Math.max(1, Math.round(Number(rawMonths))) : 12;
    const rate = Number(result && result.conversionAnnualRate);
    return {
      sampleLabel:`${count} 笔已签约成交`,
      periodLabel:`最近 ${months} 个完整月份`,
      ...(result && result.comparisonMode === 'monthly-rent' && Number.isFinite(rate)
        ? { methodLabel:`按法定参考年率 ${(rate * 100).toFixed(1)}% 将月租换算到你的押金水平` }
        : {}),
      sourceLabel:'数据来源：韩国国土交通部（MOLIT）'
    };
  }

  function comparableDisclosure(total, expanded) {
    const count = Math.max(0, Math.round(Number(total || 0)));
    if (count <= 3) return { showToggle:false, hiddenCount:0, label:'' };
    return {
      showToggle:true,
      hiddenCount:expanded ? 0 : count - 3,
      label:expanded ? '收起对比记录' : `查看全部 ${count} 条对比记录`
    };
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
    confidenceQuestion,
    confidenceExplanation,
    resultNextStep,
    verdictPresentation,
    distributionCopy,
    marketPageUrl,
    explorerUrl,
    mapRentCheckType,
    resultSentence,
    humanizeRentCheckError,
    formatWon,
    formatDifference,
    hasDistribution,
    marketPositionModel,
    distributionModel,
    marketPositionSummary,
    evidenceFacts,
    comparableDisclosure,
    percentileSentence
  };
});
