(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.KHGExperienceCapture=api;
  if(root&&root.document){
    const start=()=>api.init();
    root.document.readyState==='loading'
      ? root.document.addEventListener('DOMContentLoaded',start,{once:true})
      : start();
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const PRIVACY_NOTICE_VERSION='2026-08-28';
  const STORAGE_PREFIX='khg_experience_submitted_v1:';
  const OUTCOMES=[
    'returned_on_time',
    'returned_late',
    'returned_with_deductions',
    'not_returned_after_moveout',
    'still_renting'
  ];

  const COPY={
    en:{
      teaserTitle:'Already rented in Seoul?',
      teaserBody:'Share what actually happened. Your structured response can help the next renter.',
      open:'Share my experience',
      short:'30 seconds · no name or email',
      formTitle:'What actually happened?',
      privacy:'We collect structured answers only. No name, email, agency, or address required.',
      district:'District',
      property:'Property type',
      fee:'Brokerage fee you paid',
      feeHint:'Optional · excluding VAT and separate service charges.',
      deposit:'What happened to your deposit?',
      outcomes:{
        returned_on_time:'Returned in full on time',
        returned_late:'Returned in full, but late',
        returned_with_deductions:'Returned with deductions',
        not_returned_after_moveout:'Not returned after move-out',
        still_renting:'Still renting / not due yet'
      },
      submit:'Submit experience',
      sending:'Sending…',
      choose:'Please select what happened to your deposit.',
      invalidFee:'Enter the brokerage fee using numbers only.',
      error:'Could not submit. Please try again later.',
      thanks:'Thank you. Your experience now counts toward your area.',
      reference:'Report reference',
      disclosure:'Self-reported and not verified. Individual responses are never published.',
      privacyLink:'Privacy details'
    },
    'zh-CN':{
      teaserTitle:'已经在首尔租房了吗？',
      teaserBody:'分享实际发生的情况。你的结构化回答可以帮助下一位租客。',
      open:'分享我的租房经历',
      short:'约30秒 · 无需姓名或邮箱',
      formTitle:'实际发生了什么？',
      privacy:'我们只收集结构化回答，不需要姓名、邮箱、中介或地址。',
      district:'地区',
      property:'房产类型',
      fee:'你实际支付的中介费',
      feeHint:'选填 · 不含增值税和其他服务费。',
      deposit:'你的押金后来怎样了？',
      outcomes:{
        returned_on_time:'按时全额退还',
        returned_late:'逾期后全额退还',
        returned_with_deductions:'扣除部分费用后退还',
        not_returned_after_moveout:'搬出后仍未退还',
        still_renting:'仍在居住 / 尚未到期'
      },
      submit:'提交经历',
      sending:'正在提交…',
      choose:'请选择押金的实际情况。',
      invalidFee:'请只用数字填写中介费。',
      error:'暂时无法提交，请稍后再试。',
      thanks:'谢谢。你的经历已计入该地区的后续统计。',
      reference:'报告编号',
      disclosure:'租客自行报告，未经核实。我们不会公开单条回答。',
      privacyLink:'隐私说明'
    }
  };

  function text(language){ return COPY[language==='zh-CN'?'zh-CN':'en']; }
  function escapeHtml(value){
    return String(value==null?'':value).replace(/[&<>'"]/g,char=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
  }
  function normalizeFeeInput(value){
    const raw=String(value==null?'':value).trim();
    if(!raw) return null;
    if(!/^[0-9,\s]+$/.test(raw)) return null;
    const digits=raw.replace(/[^0-9]/g,'');
    if(!digits) return null;
    const amount=Number(digits);
    return Number.isSafeInteger(amount)&&amount>=0&&amount<=1_000_000_000?amount:null;
  }
  function formatFeeInput(value){
    const digits=String(value==null?'':value).replace(/[^0-9]/g,'').slice(0,10);
    if(!digits) return '';
    return Number(digits).toLocaleString('en-US');
  }
  function hashString(value){
    let hash=2166136261;
    for(let index=0;index<value.length;index+=1){
      hash^=value.charCodeAt(index);
      hash=Math.imul(hash,16777619);
    }
    return (hash>>>0).toString(36);
  }
  function contextFingerprint(context){
    const source=[
      context&&context.districtCode,
      context&&(context.savedPropertyType||context.propertyType),
      Math.round(Number(context&&context.depositWon)||0),
      Math.round(Number(context&&context.monthlyRentWon)||0),
      Math.round((Number(context&&context.areaSqm)||0)*10)/10
    ].join('|');
    return `exp_${hashString(source)}`;
  }
  function buildReportId(cryptoLike,now=Date.now(),random=Math.random){
    try{
      if(cryptoLike&&typeof cryptoLike.randomUUID==='function') return `rpt_${cryptoLike.randomUUID().replace(/-/g,'')}`;
    }catch(_){}
    return `rpt_${Number(now).toString(36)}_${Math.floor(random()*Number.MAX_SAFE_INTEGER).toString(36)}`;
  }
  function buildExperiencePayload(context,form,reportId){
    return {
      kind:'experience_report',
      reportId:String(reportId||''),
      privacyConsent:true,
      privacyNoticeVersion:PRIVACY_NOTICE_VERSION,
      language:context.language,
      districtCode:form.districtCode,
      propertyType:form.propertyType,
      depositWon:context.depositWon,
      monthlyRentWon:context.monthlyRentWon,
      areaSqm:context.areaSqm,
      agentFeePaidWon:form.agentFeePaidWon,
      depositOutcome:form.depositOutcome,
      sourcePage:context.sourcePage
    };
  }
  function analyticsParams(context,form={}){
    return {
      language:String(context&&context.language||''),
      district_code:String(form.districtCode||context&&context.districtCode||''),
      property_type:String(form.propertyType||context&&(context.savedPropertyType||context.propertyType)||''),
      deposit_outcome:String(form.depositOutcome||''),
      has_fee:form.agentFeePaidWon!==null&&form.agentFeePaidWon!==undefined&&form.agentFeePaidWon!==''
    };
  }
  function optionMarkup(options,selected){
    return (options||[]).map(option=>`<option value="${escapeHtml(option.value)}"${String(option.value)===String(selected)?' selected':''}>${escapeHtml(option.label)}</option>`).join('');
  }
  function formMarkup(language,areaOptions,typeOptions,selected={}){
    const copy=text(language);
    const privacyPath=language==='zh-CN'?'/zh/privacy/':'/privacy/';
    const outcomeMarkup=OUTCOMES.map(outcome=>`<label class="experience-outcome"><input name="depositOutcome" type="radio" value="${outcome}"><span>${escapeHtml(copy.outcomes[outcome])}</span></label>`).join('');
    return `<form class="experience-form" data-experience-form><div class="experience-heading"><h3>${escapeHtml(copy.formTitle)}</h3><p>${escapeHtml(copy.privacy)}</p></div><div class="experience-context"><label><span>${escapeHtml(copy.district)}</span><select data-experience-district>${optionMarkup(areaOptions,selected.districtCode)}</select></label><label><span>${escapeHtml(copy.property)}</span><select data-experience-property>${optionMarkup(typeOptions,selected.propertyType)}</select></label></div><label class="experience-fee"><span>${escapeHtml(copy.fee)}</span><span class="experience-money"><b>₩</b><input data-experience-fee type="text" inputmode="numeric" autocomplete="off" placeholder="360,000"></span><small>${escapeHtml(copy.feeHint)}</small></label><fieldset class="experience-outcomes"><legend>${escapeHtml(copy.deposit)}</legend><div>${outcomeMarkup}</div></fieldset><button class="search-button" type="submit">${escapeHtml(copy.submit)}</button><small class="experience-privacy">${escapeHtml(copy.disclosure)} <a href="${privacyPath}">${escapeHtml(copy.privacyLink)}</a>.</small><p class="experience-status" data-experience-status aria-live="polite"></p></form>`;
  }
  function teaserMarkup(language){
    const copy=text(language);
    return `<div class="experience-teaser-copy"><strong>${escapeHtml(copy.teaserTitle)}</strong><span>${escapeHtml(copy.teaserBody)}</span></div><button type="button" class="experience-open" data-experience-open><strong>${escapeHtml(copy.open)}</strong><small>${escapeHtml(copy.short)}</small></button>`;
  }
  function thanksMarkup(language,reportId){
    const copy=text(language);
    return `<div class="experience-thanks"><strong>${escapeHtml(copy.thanks)}</strong><span>${escapeHtml(copy.disclosure)}</span><small>${escapeHtml(copy.reference)}: <code>${escapeHtml(reportId)}</code></small></div>`;
  }
  function optionsFrom(select){
    return select&&select.options?Array.from(select.options).map(option=>({ value:String(option.value||''),label:String(option.textContent||option.label||'') })):[];
  }
  function safeTrack(eventName,params){
    try{ if(root&&typeof root.gtag==='function') root.gtag('event',eventName,params); }catch(_){}
  }
  function getStorage(){
    try{ return root&&root.localStorage||null; }catch(_){ return null; }
  }
  function hasSubmitted(storage,fingerprint){
    try{ return Boolean(storage&&storage.getItem(`${STORAGE_PREFIX}${fingerprint}`)); }catch(_){ return false; }
  }
  function markSubmitted(storage,fingerprint,reportId){
    try{ if(storage) storage.setItem(`${STORAGE_PREFIX}${fingerprint}`,String(reportId)); }catch(_){}
  }
  async function postExperience(payload,fetchImpl){
    const send=fetchImpl||(root&&root.fetch&&root.fetch.bind(root));
    if(typeof send!=='function') throw new Error('Experience storage unavailable.');
    const response=await send('/api/lead',{ method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload) });
    let data={};
    try{ data=await response.json(); }catch(_){}
    if(!response.ok) throw new Error(data.error||'Experience storage unavailable.');
    return data;
  }

  let latestContext=null;
  let moduleElement=null;
  let shownFingerprint='';
  let activeReportId='';

  function ensureModule(){
    const doc=root&&root.document;
    const result=doc&&doc.querySelector&&doc.querySelector('#rentCheckResult');
    if(!result) return null;
    if(moduleElement&&moduleElement.parentNode) return moduleElement;
    moduleElement=doc.createElement('section');
    moduleElement.className='experience-capture';
    moduleElement.dataset.experienceCapture='true';
    moduleElement.hidden=true;
    const saved=result.querySelector('[data-saved-quote-mount]');
    if(saved&&typeof saved.insertAdjacentElement==='function') saved.insertAdjacentElement('afterend',moduleElement);
    else result.appendChild(moduleElement);
    return moduleElement;
  }
  function renderThanks(language){
    moduleElement.className='experience-capture';
    moduleElement.innerHTML=thanksMarkup(language,activeReportId);
    moduleElement.hidden=false;
  }
  function openForm(){
    if(!moduleElement||!latestContext) return;
    const doc=root.document;
    const areaSelect=doc.querySelector('#rentCheckArea');
    const typeSelect=doc.querySelector('#rentCheckType');
    const language=latestContext.language==='zh-CN'?'zh-CN':'en';
    const selected={ districtCode:latestContext.districtCode,propertyType:latestContext.savedPropertyType||latestContext.propertyType };
    moduleElement.className='experience-capture';
    moduleElement.innerHTML=formMarkup(language,optionsFrom(areaSelect),optionsFrom(typeSelect),selected);
    const form=moduleElement.querySelector('[data-experience-form]');
    const feeInput=form.querySelector('[data-experience-fee]');
    const status=form.querySelector('[data-experience-status]');
    feeInput.addEventListener('input',()=>{ feeInput.value=formatFeeInput(feeInput.value); });
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const copy=text(language);
      const outcome=form.querySelector('input[name="depositOutcome"]:checked');
      const rawFee=feeInput.value.trim();
      const fee=normalizeFeeInput(rawFee);
      if(!outcome){ status.textContent=copy.choose; status.className='experience-status error'; return; }
      if(rawFee&&fee===null){ status.textContent=copy.invalidFee; status.className='experience-status error'; return; }
      const button=form.querySelector('button[type="submit"]');
      const districtCode=form.querySelector('[data-experience-district]').value;
      const propertyType=form.querySelector('[data-experience-property]').value;
      const values={ districtCode,propertyType,agentFeePaidWon:fee,depositOutcome:outcome.value };
      button.disabled=true;
      button.textContent=copy.sending;
      status.textContent='';
      if(!activeReportId) activeReportId=buildReportId(root.crypto);
      try{
        await postExperience(buildExperiencePayload(latestContext,values,activeReportId));
        const fingerprint=contextFingerprint(latestContext);
        markSubmitted(getStorage(),fingerprint,activeReportId);
        safeTrack('experience_submitted',analyticsParams(latestContext,values));
        renderThanks(language);
      }catch(_){
        status.textContent=copy.error;
        status.className='experience-status error';
        button.disabled=false;
        button.textContent=copy.submit;
      }
    });
    safeTrack('experience_form_opened',{ language });
  }
  function reveal(context){
    if(!context||!['en','zh-CN'].includes(context.language)) return;
    const module=ensureModule();
    if(!module) return;
    latestContext=context;
    activeReportId='';
    const fingerprint=contextFingerprint(context);
    if(hasSubmitted(getStorage(),fingerprint)){ module.hidden=true; return; }
    module.className='experience-capture experience-teaser';
    module.innerHTML=teaserMarkup(context.language);
    module.hidden=false;
    const button=module.querySelector('[data-experience-open]');
    if(button) button.addEventListener('click',openForm,{once:true});
    if(shownFingerprint!==fingerprint){
      safeTrack('experience_prompt_shown',{ language:context.language });
      shownFingerprint=fingerprint;
    }
  }
  function init(){
    if(!root||!root.document||typeof root.addEventListener!=='function') return null;
    ensureModule();
    root.addEventListener('khg:rent-check-result',event=>reveal(event&&event.detail));
    return moduleElement;
  }

  return {
    OUTCOMES,
    PRIVACY_NOTICE_VERSION,
    analyticsParams,
    buildExperiencePayload,
    buildReportId,
    contextFingerprint,
    formMarkup,
    formatFeeInput,
    init,
    normalizeFeeInput,
    postExperience,
    reveal,
    thanksMarkup
  };
});
