(function(root){
  'use strict';

  const SUPPORTED_LANGUAGES = new Set(['en','zh-CN']);
  let latestContext = null;
  let contextVersion = 0;

  function comparableCountBucket(value){
    const count = Math.max(0, Number(value) || 0);
    if (count < 3) return '0-2';
    if (count < 10) return '3-9';
    if (count < 30) return '10-29';
    return '30+';
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
    return {
      utmSource:params.get('utm_source') || '',
      utmMedium:params.get('utm_medium') || '',
      utmCampaign:params.get('utm_campaign') || '',
      referrerHost
    };
  }

  function buildPayload(kind, email, context, helpText){
    return {
      kind,
      email:String(email || '').trim(),
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
      helpError:zh ? '暂时无法提交问题，请稍后再试。' : 'We could not save that request right now. Please try again later.'
    };
    return text[key] || '';
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

  function bindModule(module){
    if (!module || module.dataset.leadBound === 'true') return;
    module.dataset.leadBound = 'true';
    const language = SUPPORTED_LANGUAGES.has(module.dataset.language) ? module.dataset.language : 'en';
    const leadForm = module.querySelector('[data-lead-form]');
    const helpForm = module.querySelector('[data-help-form]');
    const status = module.querySelector('[data-lead-status]');
    let savedEmail = '';

    if (leadForm) leadForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!latestContext || latestContext.language !== language) return;
      const input = leadForm.querySelector('input[name="email"]');
      const button = leadForm.querySelector('button[type="submit"]');
      const value = input ? input.value : '';
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
    root.document.querySelectorAll('[data-lead-capture]').forEach(module => {
      bindModule(module);
      if ((module.dataset.language || 'en') === context.language) resetModule(module, context);
    });
  }

  function init(){
    if (!root || !root.document || typeof root.addEventListener !== 'function') return;
    root.document.querySelectorAll('[data-lead-capture]').forEach(bindModule);
    root.addEventListener('khg:rent-check-result', event => revealForContext(event && event.detail));
  }

  const api = { comparableCountBucket, buildPayload, revealForContext, init };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root && root.document) init();
})(typeof window !== 'undefined' ? window : globalThis);
