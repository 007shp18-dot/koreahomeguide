(function(root){
  'use strict';

  const SUPPORTED_LANGUAGES = new Set(['en','zh-CN']);
  const SHAREABLE_PROPERTY_TYPES = new Set(['apartment','officetel','villa','detached']);
  const SHARE_DISTRICTS = {
    en:{ '11680':'Gangnam-gu', '11440':'Mapo-gu', '11170':'Yongsan-gu', '11200':'Seongdong-gu', '11560':'Yeongdeungpo-gu', '11620':'Gwanak-gu', '11230':'Dongdaemun-gu', '11410':'Seodaemun-gu', '11290':'Seongbuk-gu', '11215':'Gwangjin-gu', '11110':'Jongno-gu', '11140':'Jung-gu', '11260':'Jungnang-gu', '11305':'Gangbuk-gu', '11320':'Dobong-gu', '11350':'Nowon-gu', '11380':'Eunpyeong-gu', '11470':'Yangcheon-gu', '11500':'Gangseo-gu', '11530':'Guro-gu', '11545':'Geumcheon-gu', '11590':'Dongjak-gu', '11650':'Seocho-gu', '11710':'Songpa-gu', '11740':'Gangdong-gu' },
    'zh-CN':{ '11680':'江南区', '11440':'麻浦区', '11170':'龙山区', '11200':'城东区', '11560':'永登浦区', '11620':'冠岳区', '11230':'东大门区', '11410':'西大门区', '11290':'城北区', '11215':'广津区', '11110':'钟路区', '11140':'中区', '11260':'中浪区', '11305':'江北区', '11320':'道峰区', '11350':'芦原区', '11380':'恩平区', '11470':'阳川区', '11500':'江西区', '11530':'九老区', '11545':'衿川区', '11590':'铜雀区', '11650':'瑞草区', '11710':'松坡区', '11740':'江东区' }
  };
  const SHARE_PROPERTY_LABELS = {
    en:{ apartment:'apartment', officetel:'officetel', villa:'low-rise multifamily home', detached:'detached & multi-unit house' },
    'zh-CN':{ apartment:'公寓', officetel:'Officetel', villa:'低层多户住宅', detached:'独栋及多户住宅' }
  };
  let latestContext = null;
  let contextVersion = 0;

  function comparableCountBucket(value){
    const count = Math.max(0, Number(value) || 0);
    if (count < 3) return '0-2';
    if (count < 10) return '3-9';
    if (count < 30) return '10-29';
    return '30+';
  }

  function buildShareUrl(context){
    const language = context && context.language === 'zh-CN' ? 'zh-CN' : 'en';
    const path = language === 'zh-CN' ? '/zh/tools/seoul-rent-check/' : '/tools/seoul-rent-check/';
    const url = new URL(path, 'https://koreahomeguide.com');
    const districtCode = String(context && context.districtCode || '');
    const propertyType = String(context && context.propertyType || '');
    if (/^\d{5}$/.test(districtCode)) url.searchParams.set('lawdCd', districtCode);
    if (SHAREABLE_PROPERTY_TYPES.has(propertyType)) url.searchParams.set('type', propertyType);
    url.searchParams.set('utm_source', 'result_share');
    url.searchParams.set('utm_medium', 'referral');
    url.searchParams.set('utm_campaign', 'rent_check_share');
    return url.toString();
  }

  function shareRatingText(rating, language){
    const labels = language === 'zh-CN'
      ? { below:'低于近期水平', fair:'接近近期水平', above:'高于近期水平', insufficient:'可比数据不足' }
      : { below:'below recent levels', fair:'close to recent levels', above:'above recent levels', insufficient:'not enough comparable data' };
    return labels[rating] || labels.insufficient;
  }

  function buildShareCardModel(context){
    const language = context && context.language === 'zh-CN' ? 'zh-CN' : 'en';
    const zh = language === 'zh-CN';
    const rating = String(context && context.rating || 'insufficient');
    const confidence = String(context && context.confidence || '');
    const verdicts = zh
      ? { below:'低于近期水平', fair:'接近近期水平', above:'高于近期水平', insufficient:'可比数据不足' }
      : { below:'Below recent levels', fair:'Close to recent levels', above:'Above recent levels', insufficient:'Not enough comparable data' };
    const evidence = zh
      ? { high:'较强', medium:'一般', low:'有限' }
      : { high:'Strong', medium:'Moderate', low:'Limited' };
    const nextActions = zh
      ? {
          above:'询问溢价原因，再核对合同与安全检查项目。',
          insufficient:'扩大条件重新检查，并在签约前核对登记与合同。',
          default:'继续核对合同与签约前安全检查项目。'
        }
      : {
          above:'Ask what explains the premium, then compare the contract and safety checks.',
          insufficient:'Run a broader check, then verify the registry and contract before signing.',
          default:'Review the contract and safety checks before signing.'
        };
    return {
      verdict:verdicts[rating] || verdicts.insufficient,
      evidence:evidence[confidence] || (zh ? '未评级' : 'Not rated'),
      comparableCount:String(Math.max(0, Number(context && context.comparableCount) || 0)),
      nextAction:nextActions[rating] || nextActions.default
    };
  }

  function buildSharePayload(context){
    const language = context && context.language === 'zh-CN' ? 'zh-CN' : 'en';
    const district = SHARE_DISTRICTS[language][String(context && context.districtCode || '')] || (language === 'zh-CN' ? '首尔' : 'Seoul');
    const property = SHARE_PROPERTY_LABELS[language][String(context && context.propertyType || '')] || (language === 'zh-CN' ? '住宅' : 'rental');
    const count = Math.max(0, Number(context && context.comparableCount) || 0);
    const rating = shareRatingText(context && context.rating, language);
    const model = buildShareCardModel(context || {});
    const text = language === 'zh-CN'
      ? `我用 KoreaHomeGuide 检查了${district || '首尔'}${property || '住宅'}租金：${rating}，参考了 ${count} 笔近期官方签约成交。依据：${model.evidence}。下一步：${model.nextAction}`
      : `I checked a ${district || 'Seoul'} ${property || 'rental'} quote with KoreaHomeGuide: ${rating}, based on ${count} recent official signed contracts. Evidence: ${model.evidence}. Next: ${model.nextAction}`;
    return {
      title:language === 'zh-CN' ? 'KoreaHomeGuide 首尔租金检查' : 'KoreaHomeGuide Seoul Rent Check',
      text,
      url:buildShareUrl(context || {})
    };
  }

  async function deliverShare(payload, navigatorLike){
    const nav = navigatorLike || {};
    if (typeof nav.share === 'function') {
      try {
        await nav.share(payload);
        return 'native';
      } catch (error) {
        if (error && error.name === 'AbortError') return 'cancelled';
      }
    }
    if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      await nav.clipboard.writeText(`${payload.text}\n${payload.url}`);
      return 'clipboard';
    }
    throw new Error('Sharing is unavailable.');
  }

  async function copySharePayload(payload, navigatorLike){
    const nav = navigatorLike || {};
    if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      await nav.clipboard.writeText(`${payload.text}\n${payload.url}`);
      return 'clipboard';
    }
    throw new Error('Clipboard is unavailable.');
  }

  function shareAnalyticsParams(context, method){
    return {
      language:String(context && context.language || ''),
      source_page:String(context && context.sourcePage || ''),
      district_code:String(context && context.districtCode || ''),
      property_type:String(context && context.propertyType || ''),
      rating:String(context && context.rating || ''),
      confidence:String(context && context.confidence || ''),
      comparable_count_bucket:comparableCountBucket(context && context.comparableCount),
      share_method:String(method || '')
    };
  }

  function trackResultShare(context, method){
    try {
      if (typeof root.gtag === 'function') root.gtag('event', 'rent_check_result_share', shareAnalyticsParams(context, method));
    } catch (_) {
      // Analytics must never block sharing.
    }
  }

  function safeTrack(eventName, context){
    try {
      if (typeof root.gtag !== 'function' || !eventName) return;
      const params = {
        language:String(context && context.language || ''),
        source_page:String(context && context.sourcePage || ''),
        district_code:String(context && context.districtCode || ''),
        property_type:String(context && context.propertyType || ''),
        rating:String(context && context.rating || ''),
        confidence:String(context && context.confidence || ''),
        comparable_count_bucket:comparableCountBucket(context && context.comparableCount),
        sufficient:String(context && context.rating || '') !== 'insufficient'
      };
      root.gtag('event', eventName, params);
    } catch (_) {
      // Analytics must never block the lead flow.
    }
  }

  function attribution(){
    let referrerHost = '';
    try { referrerHost = root.document.referrer ? new URL(root.document.referrer).hostname : ''; } catch (_) {}
    const params = new URLSearchParams(root.location && root.location.search || '');
    const acquisition = root.KHGRentCheckPrefill
      ? root.KHGRentCheckPrefill.readRentCheckPrefill(root.location && root.location.search || '')
      : {};
    return {
      utmSource:acquisition.originSource || params.get('utm_source') || '',
      utmMedium:acquisition.originMedium || params.get('utm_medium') || '',
      utmCampaign:acquisition.originCampaign || params.get('utm_campaign') || '',
      referrerHost
    };
  }

  function buildPayload(kind, email, context, helpText){
    return {
      kind,
      email:String(email || '').trim(),
      privacyConsent:true,
      privacyNoticeVersion:'2026-08-27',
      language:context.language,
      districtCode:context.districtCode,
      propertyType:context.propertyType,
      depositWon:context.depositWon,
      monthlyRentWon:context.monthlyRentWon,
      areaSqm:context.areaSqm,
      rating:context.rating,
      confidence:context.confidence,
      askingValueWon:context.askingValueWon,
      medianValueWon:context.medianValueWon,
      differencePct:context.differencePct,
      comparableCount:context.comparableCount,
      monthsUsed:context.monthsUsed,
      dataThroughMonth:context.dataThroughMonth,
      sourcePage:context.sourcePage,
      helpMessage:kind === 'help_request' ? String(helpText || '').trim() : '',
      ...attribution()
    };
  }

  async function postLead(payload){
    const response = await fetch('/api/lead', {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body:JSON.stringify(payload)
    });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(data.error || 'Lead storage is temporarily unavailable.');
    return data;
  }

  function localText(language, key){
    const zh = language === 'zh-CN';
    const text = {
      saving:zh ? '正在保存…' : 'Saving…',
      saved:zh ? '已记录。我们会用这次结果完善面向早期用户的详细租金检查后续服务。' : 'Saved. We’ll use this result to improve detailed rent-check follow-up for early users.',
      saveError:zh ? '暂时无法保存邮箱。你的租金检查结果仍然有效，请稍后再试。' : 'We could not save your email right now. Your rent-check result is still available; please try again later.',
      helpSaving:zh ? '正在提交…' : 'Sending…',
      helpSaved:zh ? '已记录你的问题。' : 'Your question is saved.',
      helpError:zh ? '暂时无法提交问题，请稍后再试。' : 'We could not save that request right now. Please try again later.',
      shareTitle:zh ? '分享这次检查' : 'Share this check',
      shareDescription:zh ? '发送不含具体报价的结果摘要和检查链接。' : 'Send a privacy-safe summary with a link to check another quote.',
      shareButton:zh ? '分享结果' : 'Share this result',
      copyButton:zh ? '复制摘要' : 'Copy summary',
      downloadButton:zh ? '下载结果卡片' : 'Download result card',
      verdictLabel:zh ? '判断' : 'Verdict',
      evidenceLabel:zh ? '依据等级' : 'Evidence',
      countLabel:zh ? '可比成交' : 'Comparables',
      nextLabel:zh ? '建议下一步' : 'Suggested next step',
      privacyNote:zh ? '不含具体报价、押金、面积或个人信息。' : 'No exact quote is included—nor deposit, area or personal details.',
      sharing:zh ? '正在打开分享…' : 'Opening share options…',
      copied:zh ? '结果摘要和链接已复制。' : 'Result summary and link copied.',
      shared:zh ? '已分享。' : 'Shared.',
      downloaded:zh ? '结果卡片已下载。' : 'Result card downloaded.',
      shareError:zh ? '暂时无法分享，请稍后再试。' : 'Sharing is unavailable right now. Please try again.',
      consentRequired:zh ? '请先同意隐私说明，才能保存邮箱和本次租金检查信息。' : 'Please agree to the privacy notice before saving your email and rent-check context.'
    };
    return text[key] || '';
  }

  function loadShareCardLibrary(){
    if (root.KHGResultShareCard) return Promise.resolve(root.KHGResultShareCard);
    return new Promise((resolve,reject) => {
      const existing = root.document.querySelector('script[data-result-share-card]');
      if (existing) {
        existing.addEventListener('load', () => resolve(root.KHGResultShareCard), { once:true });
        existing.addEventListener('error', reject, { once:true });
        return;
      }
      const script = root.document.createElement('script');
      script.src = '/result-share-card.js'; script.async = true; script.dataset.resultShareCard = '';
      script.addEventListener('load', () => root.KHGResultShareCard ? resolve(root.KHGResultShareCard) : reject(new Error('Card library unavailable.')), { once:true });
      script.addEventListener('error', reject, { once:true });
      root.document.head.appendChild(script);
    });
  }

  function bindShareModule(module){
    if (!module || module.dataset.shareBound === 'true') return;
    module.dataset.shareBound = 'true';
    const language = SUPPORTED_LANGUAGES.has(module.dataset.language) ? module.dataset.language : 'en';
    const button = module.querySelector('[data-share-button]');
    const copyButton = module.querySelector('[data-copy-button]');
    const downloadButton = module.querySelector('[data-download-card]');
    const status = module.querySelector('[data-share-status]');
    if (!button) return;
    const runAction = async (actionButton, forceCopy) => {
      if (!latestContext || latestContext.language !== language) return;
      actionButton.disabled = true;
      if (status) status.textContent = forceCopy ? '' : localText(language, 'sharing');
      const payload = buildSharePayload(latestContext);
      try {
        const method = forceCopy
          ? await copySharePayload(payload, root.navigator)
          : await deliverShare(payload, root.navigator);
        if (method === 'cancelled') {
          if (status) status.textContent = '';
        } else {
          if (status) status.textContent = localText(language, method === 'native' ? 'shared' : 'copied');
          trackResultShare(latestContext, method);
        }
      } catch (_) {
        if (status) status.textContent = localText(language, 'shareError');
      } finally {
        actionButton.disabled = false;
      }
    };
    button.addEventListener('click', () => runAction(button, false));
    if (copyButton) copyButton.addEventListener('click', () => runAction(copyButton, true));
    if (downloadButton) downloadButton.addEventListener('click', async () => {
      if (!latestContext || latestContext.language !== language) return;
      downloadButton.disabled = true;
      try {
        const card = await loadShareCardLibrary();
        await card.downloadCard(buildShareCardModel(latestContext), { language, filename:'koreahomeguide-rent-check.svg' });
        if (status) status.textContent = localText(language, 'downloaded');
        trackResultShare(latestContext, 'download');
      } catch (_) { if (status) status.textContent = localText(language, 'shareError'); }
      finally { downloadButton.disabled = false; }
    });
  }

  function updateShareModule(module, context){
    if (!module || !context) return;
    const model = buildShareCardModel(context);
    const values = {
      '[data-share-verdict]':model.verdict,
      '[data-share-evidence]':model.evidence,
      '[data-share-count]':model.comparableCount,
      '[data-share-next]':model.nextAction
    };
    Object.entries(values).forEach(([selector, value]) => {
      const node = module.querySelector(selector);
      if (node) node.textContent = value;
    });
  }

  function ensureShareModule(){
    const result = root.document.querySelector('#rentCheckResult');
    if (!result) return null;
    let module = result.querySelector('[data-result-share]');
    if (!module) {
      const language = root.document.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en';
      module = root.document.createElement('div');
      module.className = 'result-share-panel';
      module.dataset.resultShare = '';
      module.dataset.language = language;
      module.innerHTML = `<div class="result-share-copy"><strong>${localText(language, 'shareTitle')}</strong><span>${localText(language, 'shareDescription')}</span></div><dl class="result-share-metrics"><div><dt>${localText(language, 'verdictLabel')}</dt><dd data-share-verdict>—</dd></div><div><dt>${localText(language, 'evidenceLabel')}</dt><dd data-share-evidence>—</dd></div><div><dt>${localText(language, 'countLabel')}</dt><dd data-share-count>—</dd></div></dl><div class="result-share-next"><span>${localText(language, 'nextLabel')}</span><strong data-share-next>—</strong></div><small class="result-share-privacy">${localText(language, 'privacyNote')}</small><div class="result-share-actions"><button class="search-button result-share-action" type="button" data-share-button>${localText(language, 'shareButton')}</button><button class="result-share-action result-share-copy-button" type="button" data-copy-button>${localText(language, 'copyButton')}</button><button class="result-share-action result-share-copy-button" type="button" data-download-card>${localText(language, 'downloadButton')}</button></div><span class="result-share-status" data-share-status aria-live="polite"></span>`;
      result.appendChild(module);
    }
    bindShareModule(module);
    return module;
  }

  function resetModule(module, context){
    module.hidden = false;
    module.dataset.contextVersion = String(contextVersion);
    const status = module.querySelector('[data-lead-status]');
    const leadForm = module.querySelector('[data-lead-form]');
    const helpForm = module.querySelector('[data-help-form]');
    if (status) { status.textContent = ''; status.className = 'lead-capture-status'; }
    if (leadForm) { leadForm.hidden = false; const button = leadForm.querySelector('button[type="submit"]'); if (button) button.disabled = false; }
    if (helpForm) { helpForm.hidden = true; const button = helpForm.querySelector('button[type="submit"]'); if (button) button.disabled = false; }
    if (module.dataset.viewedVersion !== String(contextVersion)) {
      safeTrack('lead_form_view', context);
      module.dataset.viewedVersion = String(contextVersion);
    }
  }

  function ensureLeadConsent(leadForm, language){
    if (!leadForm) return null;
    let note = leadForm.querySelector('.lead-consent-note');
    if (!note) {
      note = root.document.createElement('small');
      note.className = 'lead-consent-note';
      leadForm.appendChild(note);
    }
    const zh = language === 'zh-CN';
    note.innerHTML = zh
      ? '<label class="lead-consent-choice"><input type="checkbox" name="privacyConsent" required> <span>我同意 KoreaHomeGuide 为保存并回复本次请求而处理我的邮箱和租金检查信息。未经另行同意，不发送推广邮件。<a href="/zh/privacy/">隐私说明</a></span></label>'
      : '<label class="lead-consent-choice"><input type="checkbox" name="privacyConsent" required> <span>I agree that KoreaHomeGuide may process my email and rent-check context to save and respond to this request. No promotional email without separate consent. <a href="/privacy/">Privacy</a></span></label>';
    return note.querySelector('input[name="privacyConsent"]');
  }

  function bindModule(module){
    if (!module || module.dataset.leadBound === 'true') return;
    module.dataset.leadBound = 'true';
    const language = SUPPORTED_LANGUAGES.has(module.dataset.language) ? module.dataset.language : 'en';
    const leadForm = module.querySelector('[data-lead-form]');
    const helpForm = module.querySelector('[data-help-form]');
    const status = module.querySelector('[data-lead-status]');
    const consent = ensureLeadConsent(leadForm, language);
    let savedEmail = '';

    if (leadForm) leadForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!latestContext || latestContext.language !== language) return;
      const input = leadForm.querySelector('input[name="email"]');
      const button = leadForm.querySelector('button[type="submit"]');
      const value = input ? input.value : '';
      if (!consent || !consent.checked) {
        if (status) { status.textContent = localText(language, 'consentRequired'); status.className = 'lead-capture-status error'; }
        if (consent && typeof consent.reportValidity === 'function') consent.reportValidity();
        return;
      }
      if (button) button.disabled = true;
      if (status) status.textContent = localText(language, 'saving');
      try {
        await postLead(buildPayload('lead_capture', value, latestContext, ''));
        savedEmail = String(value || '').trim();
        if (status) { status.textContent = localText(language, 'saved'); status.className = 'lead-capture-status success'; }
        leadForm.hidden = true;
        if (helpForm) helpForm.hidden = false;
        safeTrack('lead_submit', latestContext);
      } catch (_) {
        if (status) { status.textContent = localText(language, 'saveError'); status.className = 'lead-capture-status error'; }
        if (button) button.disabled = false;
      }
    });

    if (helpForm) helpForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!latestContext || latestContext.language !== language || !savedEmail) return;
      const textarea = helpForm.querySelector('textarea[name="helpMessage"]');
      const button = helpForm.querySelector('button[type="submit"]');
      const value = textarea ? textarea.value : '';
      if (button) button.disabled = true;
      if (status) status.textContent = localText(language, 'helpSaving');
      try {
        await postLead(buildPayload('help_request', savedEmail, latestContext, value));
        if (status) { status.textContent = localText(language, 'helpSaved'); status.className = 'lead-capture-status success'; }
        helpForm.hidden = true;
        safeTrack('help_request', latestContext);
      } catch (_) {
        if (status) { status.textContent = localText(language, 'helpError'); status.className = 'lead-capture-status error'; }
        if (button) button.disabled = false;
      }
    });
  }

  function revealForContext(context){
    if (!context || !SUPPORTED_LANGUAGES.has(context.language)) return;
    latestContext = context;
    contextVersion += 1;
    const shareModule = ensureShareModule();
    updateShareModule(shareModule, context);
    const shareStatus = shareModule && shareModule.querySelector('[data-share-status]');
    if (shareStatus) shareStatus.textContent = '';
    root.document.querySelectorAll('[data-lead-capture]').forEach(module => {
      bindModule(module);
      if ((module.dataset.language || 'en') === context.language) resetModule(module, context);
    });
  }

  function init(){
    if (!root || !root.document || typeof root.addEventListener !== 'function') return;
    ensureShareModule();
    root.document.querySelectorAll('[data-lead-capture]').forEach(bindModule);
    root.addEventListener('khg:rent-check-result', event => revealForContext(event && event.detail));
  }

  const api = { comparableCountBucket, buildPayload, buildShareUrl, buildShareCardModel, buildSharePayload, deliverShare, copySharePayload, shareAnalyticsParams, revealForContext, init };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && root.document) init();
})(typeof window !== 'undefined' ? window : globalThis);
