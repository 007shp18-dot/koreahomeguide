(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.KHGHomeStageEntry=api;
  if(root&&root.document){
    const start=()=>api.mount({root,doc:root.document});
    root.document.readyState==='loading'
      ? root.document.addEventListener('DOMContentLoaded',start,{once:true})
      : start();
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const STORAGE_KEY='khg_home_stage_v1';
  const STAGES=Object.freeze(['budget','looking','quote','signed']);
  function normalizedLanguage(language){ return language==='zh-CN'?'zh-CN':'en'; }
  function buildStageItems(language='en'){
    const zh=normalizedLanguage(language)==='zh-CN';
    return [
      {id:'budget',label:zh?'正在制定预算':'Setting a budget',href:`${zh?'/zh':''}/guides/rent-apartment-korea-foreigner/#budget`},
      {id:'looking',label:zh?'正在看房源':'Looking at listings',href:`${zh?'/zh':''}/explore/`},
      {id:'quote',label:zh?'已拿到报价':'Got a quote',href:'#rent-check'},
      {id:'signed',label:zh?'已签租约':'Signed the lease',href:`${zh?'/zh':''}/guides/rent-apartment-korea-foreigner/#move-in`}
    ];
  }
  function readStage(storage){
    try{ const value=storage&&storage.getItem(STORAGE_KEY); return STAGES.includes(value)?value:''; }
    catch(_){ return ''; }
  }
  function writeStage(storage,value){
    if(!STAGES.includes(value)) return null;
    try{ if(storage) storage.setItem(STORAGE_KEY,value); }catch(_){}
    return value;
  }
  function buildStageEvent(stage,language){
    return STAGES.includes(stage)?{stage,language:normalizedLanguage(language)}:null;
  }
  function mount({root=globalThis,doc=root&&root.document,storage}={}){
    const section=doc&&doc.querySelector('[data-home-stage-entry]');
    if(!section||section.dataset.stageMounted==='true') return null;
    section.dataset.stageMounted='true';
    const language=section.dataset.language==='zh-CN'?'zh-CN':'en';
    let targetStorage=storage;
    if(targetStorage===undefined){ try{ targetStorage=root.localStorage; }catch(_){ targetStorage=null; } }
    const previous=readStage(targetStorage);
    const status=section.querySelector('[data-home-stage-return]');
    for(const link of section.querySelectorAll('[data-home-stage]')){
      const stage=String(link.dataset.homeStage||'');
      if(stage===previous){
        link.classList.add('is-return-stage');
        link.setAttribute('aria-current','step');
        const label=link.querySelector('strong');
        if(status&&label) status.textContent=language==='zh-CN'?`上次选择：${label.textContent}`:`Last selected: ${label.textContent}`;
      }
      link.addEventListener('click',()=>{
        if(!writeStage(targetStorage,stage)) return;
        const payload=buildStageEvent(stage,language);
        try{ if(payload&&typeof root.gtag==='function') root.gtag('event','stage_selected',payload); }catch(_){}
      });
    }
    return section;
  }
  return {STORAGE_KEY,STAGES,buildStageItems,readStage,writeStage,buildStageEvent,mount};
});
