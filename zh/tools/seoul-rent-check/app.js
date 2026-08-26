(function(){
'use strict';
const language = document.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en';
const locale = language === 'zh-CN' ? 'zh-CN' : 'en-US';
const zh = language === 'zh-CN';
const currencySelect=document.querySelector('#currencySelect');
const currencyInputs=[...document.querySelectorAll('[data-currency-input]')];
let fxRates={}; let activeInputCurrency='KRW';
function selectedCurrency(){return currencySelect?currencySelect.value:'KRW';}
function getInputWon(input){const n=Number(input&&input.dataset.krwValue||0);return Number.isFinite(n)?n:0;}
function renderCurrencyReference(input,won,currency){const ref=document.querySelector(`[data-currency-reference-for="${input.id}"]`);if(ref)ref.textContent=currency==='KRW'?'':`≈ ${KHGCurrency.formatWon(won,locale)}`;}
function syncCurrencyInput(input){if(!input)return;const won=KHGCurrency.convertToKrw(Number(input.value||0),activeInputCurrency,fxRates);if(won!=null){input.dataset.krwValue=String(Math.round(won));renderCurrencyReference(input,won,activeInputCurrency);}}
function moneyHtml(won){return KHGCurrency.formatMoneyHtml(won,selectedCurrency(),fxRates,locale);}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function renderCurrencyInputs(currency){if(currency!=='KRW'&&!Number(fxRates[currency]))return false;currencyInputs.forEach(input=>{const won=getInputWon(input);const shown=KHGCurrency.convertFromKrw(won,currency,fxRates);input.value=KHGCurrency.formatInputAmount(shown,currency);input.step=currency==='KRW'?(input.dataset.krwStep||'1'):'1';renderCurrencyReference(input,won,currency);});document.querySelectorAll('[data-currency-symbol]').forEach(el=>el.textContent=KHGCurrency.currencySymbol(currency));activeInputCurrency=currency;return true;}
async function loadFx(){if(!currencySelect)return;currencySelect.disabled=true;try{const r=await fetch('/api/fx');const d=await r.json();if(!r.ok)throw new Error();fxRates=d.rates||{};if(!renderCurrencyInputs(currencySelect.value)){currencySelect.value='KRW';renderCurrencyInputs('KRW');}}catch(_){fxRates={};currencySelect.value='KRW';renderCurrencyInputs('KRW');}finally{currencySelect.disabled=false;}}
currencyInputs.forEach(input=>input.addEventListener('input',()=>syncCurrencyInput(input)));
if(currencySelect)currencySelect.addEventListener('change',()=>{currencyInputs.forEach(syncCurrencyInput);if(!renderCurrencyInputs(currencySelect.value))currencySelect.value=activeInputCurrency;});

const form=document.querySelector('#rentCheckForm');
const area=document.querySelector('#rentCheckArea');
const type=document.querySelector('#rentCheckType');
const deposit=document.querySelector('#rentCheckDeposit');
const rent=document.querySelector('#rentCheckRent');
const areaSqm=document.querySelector('#rentCheckAreaSqm');
const button=document.querySelector('#rentCheckButton');
const status=document.querySelector('#rentCheckStatus');
const result=document.querySelector('#rentCheckResult');
const rating=document.querySelector('#rentCheckRating');
const confidence=document.querySelector('#rentCheckConfidence');
const message=document.querySelector('#rentCheckMessage');
const meta=document.querySelector('#rentCheckMeta');
const asking=document.querySelector('#rentCheckAsking');
const median=document.querySelector('#rentCheckMedian');
const difference=document.querySelector('#rentCheckDifference');
const summary=document.querySelector('#rentCheckEvidenceSummary');
const body=document.querySelector('#rentCheckComparableBody');
const studioNote=document.querySelector('#rentCheckStudioNote');
let acquisitionContext={};
const analyticsDistrictCodes=new Set(['11680','11200','11440','11170','11560','11620','11230','11410','11290','11215']);
const analyticsPropertyTypes=new Set(['apartment','officetel','villa','detached']);
let toolViewTracked=false;

function safeTrack(eventName,params){try{if(!params||typeof window.gtag!=='function')return false;window.gtag('event',eventName,params);return true;}catch(_){return false;}}
function toolPage(){const path=String(location.pathname||'');return['/','/zh/','/tools/seoul-rent-check/','/zh/tools/seoul-rent-check/'].includes(path)?path:'';}
function sourcePage(){return String(acquisitionContext.sourcePage||'')||toolPage();}
function trackBase(mapped,data){const districtCode=String(area&&area.value||''),propertyType=String(mapped&&mapped.officialType||'');if(!analyticsDistrictCodes.has(districtCode)||!analyticsPropertyTypes.has(propertyType))return null;return{language,source_page:sourcePage(),tool_page:toolPage(),district_code:districtCode,property_type:propertyType,rating:data&&data.rating||'',confidence:data&&data.confidence||'',sufficient:data?data.rating!=='insufficient':undefined};}
function errorCategory(err){if(err&&err.name==='AbortError')return'request_aborted';if(err&&err.name==='TypeError')return'network';if(err&&err.name==='SyntaxError')return'invalid_response';return'request_failed';}
function emitToolView(){if(toolViewTracked)return;const context=trackBase(KHGRentCheckUI.mapRentCheckType(type.value),null);if(safeTrack('rent_check_tool_view',context))toolViewTracked=true;}
function emitResult(data,mapped,depositWon,rentWon,sqm){const detail={language,sourcePage:acquisitionContext.sourcePage||location.pathname,districtCode:area.value,propertyType:mapped.officialType,depositWon,monthlyRentWon:rentWon,areaSqm:sqm,rating:data.rating||'insufficient',confidence:data.confidence||null,askingValueWon:data.askingValueWon??null,medianValueWon:data.medianValueWon??null,differencePct:data.differencePct??null,comparableCount:Number(data.comparableCount||0),monthsUsed:Number(data.monthsUsed||12),dataThroughMonth:data.dataThroughMonth||null};window.dispatchEvent(new CustomEvent('khg:rent-check-result',{detail}));safeTrack('rent_check_result',trackBase(mapped,data));}
function applyExplorerPrefill(){if(!window.KHGRentCheckPrefill)return;acquisitionContext=KHGRentCheckPrefill.readRentCheckPrefill(location.search);const prefill=acquisitionContext;if(prefill.lawdCd&&[...area.options].some(option=>option.value===prefill.lawdCd))area.value=prefill.lawdCd;if(prefill.type&&[...type.options].some(option=>option.value===prefill.type))type.value=prefill.type;if(Object.prototype.hasOwnProperty.call(prefill,'depositWon'))deposit.dataset.krwValue=String(Math.round(prefill.depositWon));if(Object.prototype.hasOwnProperty.call(prefill,'rentWon'))rent.dataset.krwValue=String(Math.round(prefill.rentWon));if(Object.prototype.hasOwnProperty.call(prefill,'areaSqm'))areaSqm.value=String(prefill.areaSqm);}
function setStatus(text,state=''){status.textContent=text;status.className=`rent-check-status${state?` ${state}`:''}`;}
function updateStudio(){studioNote.hidden=type.value!=='studio';}
function ensureDistributionPanel(){let distribution=document.querySelector('#rentCheckDistribution');if(!distribution){distribution=document.createElement('section');distribution.id='rentCheckDistribution';distribution.className='rent-check-intelligence';distribution.hidden=true;distribution.innerHTML=zh?`<div class="rent-check-evidence-head"><div><strong>公平租金参考</strong><span>基于同一组可比已签约成交的价格分布</span></div></div><div class="rent-check-metrics"><div><span>典型区间（P25–P75）</span><strong id="rentCheckRange">-</strong></div><div><span>在可比成交中的位置</span><strong id="rentCheckPercentile">-</strong></div></div>`:`<div class="rent-check-evidence-head"><div><strong>Fair Rent Intelligence</strong><span>Distribution of the same comparable signed contracts</span></div></div><div class="rent-check-metrics"><div><span>Typical range (P25–P75)</span><strong id="rentCheckRange">-</strong></div><div><span>Position in comparable market</span><strong id="rentCheckPercentile">-</strong></div></div>`;const evidenceHead=result.querySelector('.rent-check-evidence-head');if(evidenceHead)evidenceHead.insertAdjacentElement('beforebegin',distribution);else result.appendChild(distribution);}return{distribution,range:distribution.querySelector('#rentCheckRange'),percentile:distribution.querySelector('#rentCheckPercentile')};}
function renderDistribution(data){const{distribution,range,percentile}=ensureDistributionPanel();const valid=KHGRentCheckUI.hasDistribution(data);distribution.hidden=!valid;if(!valid){range.textContent='-';percentile.textContent='';return;}range.innerHTML=`${moneyHtml(data.p25ValueWon)} <span aria-hidden="true">–</span> ${moneyHtml(data.p75ValueWon)}`;percentile.textContent=KHGRentCheckUI.percentileSentence(data);}
function renderRows(items){body.innerHTML=(items&&items.length)?items.map(item=>`<tr><td>${escapeHtml(item.building||'-')}</td><td>${Number(item.areaSqm).toFixed(1)}㎡</td><td>${moneyHtml(item.depositWon)}</td><td>${moneyHtml(item.monthlyRentWon)}</td><td>${KHGDate.formatDate(item.contractDate,locale)}</td></tr>`).join(''):`<tr class="empty-row"><td colspan="5">${zh?'暂时没有足够可靠的可比成交记录。':'No reliable comparable set is available.'}</td></tr>`;}
function renderResult(data){result.hidden=false;rating.textContent=KHGRentCheckUI.ratingLabel(data.rating);rating.className=`rent-rating ${data.rating||'insufficient'}`;message.textContent=KHGRentCheckUI.resultSentence(data);asking.innerHTML=moneyHtml(data.askingValueWon);median.innerHTML=data.medianValueWon==null?'-':moneyHtml(data.medianValueWon);difference.textContent=data.differencePct==null?'-':KHGRentCheckUI.formatDifference(data.differencePct);if(data.confidence){confidence.hidden=false;confidence.textContent=KHGRentCheckUI.confidenceLabel(data.confidence);confidence.className=`confidence-pill ${data.confidence}`;}else confidence.hidden=true;const count=Number(data.comparableCount||0),months=Number(data.monthsUsed||12);meta.textContent=data.rating==='insufficient'?(zh?`已搜索最近 ${months} 个完整月份，但数据仍不足以做出可靠判断。`:`Searched the latest ${months} completed months; not enough data for a reliable verdict.`):(zh?`${count} 笔可比成交 · 最近 ${months} 个完整月份。`:`${count} comparable contracts · latest ${months} completed months.`);summary.textContent=data.rating==='insufficient'?(zh?`找到 ${count} 笔可能匹配的成交；至少需要 3 笔合适记录才能判断。`:`${count} possible matches found; at least 3 suitable records are required.`):(zh?`${count} 笔已签约成交符合当前比较条件。`:`${count} signed contracts matched the current comparison.`);renderDistribution(data);renderRows(data.comparables||[]);}

if(form)form.addEventListener('submit',async e=>{e.preventDefault();syncCurrencyInput(deposit);syncCurrencyInput(rent);const depositWon=getInputWon(deposit),rentWon=getInputWon(rent),sqm=Number(areaSqm.value);if(!Number.isFinite(sqm)||sqm<=0)return setStatus(zh?'面积必须大于 0。':'Size must be greater than zero.','error');const mapped=KHGRentCheckUI.mapRentCheckType(type.value);updateStudio();setStatus(zh?'正在查找类似的官方成交记录…':'Finding similar official contracts…','loading');button.disabled=true;safeTrack('rent_check_start',trackBase(mapped,null));try{const q=new URLSearchParams({lawdCd:area.value,type:mapped.officialType,deposit:String(Math.round(depositWon)),rent:String(Math.round(rentWon)),area:String(sqm)});const r=await fetch(`/api/rent-check?${q}`);const data=await r.json();if(!r.ok)throw new Error(data.error||(zh?'租金比较失败。':'Rent comparison failed.'));renderResult(data);emitResult(data,mapped,depositWon,rentWon,sqm);setStatus(data.rating==='insufficient'?(zh?'相似的官方成交记录太少，因此没有给出价格判断。':'Too few similar official contracts for a price verdict.'):(zh?'比较完成。':'Comparison complete.'),'success');}catch(err){const context=trackBase(mapped,null);if(context)safeTrack('rent_check_error',{...context,error_category:errorCategory(err)});result.hidden=true;setStatus(KHGRentCheckUI.humanizeRentCheckError(err.message),'error');}finally{button.disabled=false;}});
if(type)type.addEventListener('change',updateStudio);
applyExplorerPrefill();if(typeof window.addEventListener==='function')window.addEventListener('khg:privacy-consent',event=>{if(event&&event.detail&&event.detail.consent==='accepted')emitToolView();});if(window.KHGPrivacyConsent==='accepted')emitToolView();updateStudio();loadFx();
})();
