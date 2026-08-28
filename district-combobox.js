(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.KHGDistrictCombobox=api;
  if(root&&root.document){
    const start=()=>api.mount({root,doc:root.document});
    root.document.readyState==='loading'
      ? root.document.addEventListener('DOMContentLoaded',start,{once:true})
      : start();
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const STORAGE_KEY='khg_recent_rent_check_districts_v1';

  function normalizeSearchText(value){
    return String(value||'').normalize('NFKC').trim().toLocaleLowerCase();
  }

  function buildDistrictOptions(catalog,language='en'){
    const zh=language==='zh-CN';
    return Object.entries(catalog||{}).map(([code,item])=>{
      const primary=zh?(item['zh-CN']||item.en):item.en;
      return {
        code,
        primary,
        secondary:item.ko,
        label:`${primary} (${item.ko})`,
        search:normalizeSearchText([item.en,item.ko,item['zh-CN'],item.slug].filter(Boolean).join(' '))
      };
    });
  }

  function filterDistricts(rows,query){
    const needle=normalizeSearchText(query);
    return needle?(rows||[]).filter(row=>row.search.includes(needle)):[...(rows||[])];
  }

  function validCodes(catalog){ return new Set(Object.keys(catalog||{})); }

  function readRecent(storage,catalog){
    try{
      const parsed=JSON.parse(storage&&storage.getItem(STORAGE_KEY)||'[]');
      const allowed=validCodes(catalog);
      return Array.isArray(parsed)?[...new Set(parsed.map(String).filter(code=>allowed.has(code)))].slice(0,3):[];
    }catch(_){
      return [];
    }
  }

  function writeRecent(storage,code,catalog){
    const value=String(code||'');
    if(!validCodes(catalog).has(value)) return null;
    const next=[value,...readRecent(storage,catalog).filter(item=>item!==value)].slice(0,3);
    try{ if(storage) storage.setItem(STORAGE_KEY,JSON.stringify(next)); }catch(_){}
    return value;
  }

  function mount({root=globalThis,doc=root&&root.document,storage,catalog}={}){
    const select=doc&&doc.querySelector&&doc.querySelector('#rentCheckArea');
    const districts=catalog||(root&&root.KHGLocations&&root.KHGLocations.RENT_CHECK_DISTRICTS);
    if(!select||!districts||select.dataset.districtComboboxMounted==='true'||!doc.createElement) return null;
    const parent=select.parentNode;
    if(!parent||typeof parent.insertBefore!=='function') return null;
    let wrapper=null;
    try{
      const language=doc.documentElement&&doc.documentElement.lang==='zh-CN'?'zh-CN':'en';
      const rows=buildDistrictOptions(districts,language);
      const byCode=new Map(rows.map(row=>[row.code,row]));
      if(!rows.length||!byCode.has(String(select.value||''))) return null;
      let targetStorage=storage;
      if(targetStorage===undefined){ try{ targetStorage=root.localStorage; }catch(_){ targetStorage=null; } }

      wrapper=doc.createElement('div');
      wrapper.className='district-combobox';
      wrapper.dataset.districtCombobox='true';
      const input=doc.createElement('input');
      const listbox=doc.createElement('div');
      const listId=`${select.id||'rentCheckArea'}Listbox`;
      input.type='text';
      input.className='district-combobox-input';
      input.setAttribute('role','combobox');
      input.setAttribute('aria-autocomplete','list');
      input.setAttribute('aria-expanded','false');
      input.setAttribute('aria-controls',listId);
      input.setAttribute('aria-label',language==='zh-CN'?'地区':'Area');
      input.setAttribute('autocomplete','off');
      input.setAttribute('placeholder',language==='zh-CN'?'搜索英文、中文或韩文地区名':'Search in English, Korean, or Chinese');
      listbox.id=listId;
      listbox.className='district-combobox-listbox';
      listbox.setAttribute('role','listbox');
      listbox.hidden=true;
      wrapper.appendChild(input);
      wrapper.appendChild(listbox);
      parent.insertBefore(wrapper,select.nextSibling||null);

      let visible=[];
      let activeIndex=-1;
      const close=()=>{
        listbox.hidden=true;
        input.setAttribute('aria-expanded','false');
        input.removeAttribute('aria-activedescendant');
        activeIndex=-1;
      };
      const setActive=index=>{
        if(!visible.length){ activeIndex=-1; return; }
        activeIndex=Math.max(0,Math.min(index,visible.length-1));
        [...listbox.children].forEach((option,i)=>{
          option.classList.toggle('is-active',i===activeIndex);
          option.setAttribute('aria-selected',String(i===activeIndex));
        });
        const option=listbox.children[activeIndex];
        if(option){
          input.setAttribute('aria-activedescendant',option.id);
          if(typeof option.scrollIntoView==='function') option.scrollIntoView({block:'nearest'});
        }
      };
      const selectRow=row=>{
        if(!row) return;
        select.value=row.code;
        input.value=row.label;
        writeRecent(targetStorage,row.code,districts);
        const EventCtor=root.Event||(typeof Event==='function'?Event:null);
        if(EventCtor&&typeof select.dispatchEvent==='function') select.dispatchEvent(new EventCtor('change',{bubbles:true}));
        close();
      };
      const render=query=>{
        const filtered=filterDistricts(rows,query);
        const recentCodes=query?[]:readRecent(targetStorage,districts);
        const recentRows=recentCodes.map(code=>byCode.get(code)).filter(Boolean);
        visible=[...recentRows,...filtered.filter(row=>!recentCodes.includes(row.code))];
        if(!normalizeSearchText(query)){
          const currentCode=String(select.value||'');
          visible=visible.filter(row=>row.code!==currentCode);
        }
        listbox.textContent='';
        visible.forEach((row,index)=>{
          const option=doc.createElement('div');
          option.id=`${listId}Option${index}`;
          option.className='district-combobox-option';
          if(recentCodes.includes(row.code)) option.classList.add('is-recent');
          option.dataset.districtCode=row.code;
          option.setAttribute('role','option');
          option.setAttribute('aria-selected','false');
          const primary=doc.createElement('strong');
          const secondary=doc.createElement('span');
          primary.textContent=row.primary;
          secondary.textContent=`${row.secondary}${recentCodes.includes(row.code)?(language==='zh-CN'?' · 最近选择':' · Recent'):''}`;
          option.appendChild(primary);
          option.appendChild(secondary);
          option.addEventListener('mousedown',event=>event.preventDefault());
          option.addEventListener('click',()=>selectRow(row));
          listbox.appendChild(option);
        });
        listbox.hidden=false;
        input.setAttribute('aria-expanded','true');
        setActive(visible.length?0:-1);
      };
      const syncFromSelect=()=>{
        const row=byCode.get(String(select.value||''));
        if(row) input.value=row.label;
      };
      input.addEventListener('focus',()=>{
        render('');
        if(typeof input.select==='function') input.select();
      });
      input.addEventListener('input',()=>render(input.value));
      input.addEventListener('keydown',event=>{
        if(event.key==='Escape'){
          event.preventDefault(); close(); syncFromSelect(); return;
        }
        if(event.key==='ArrowDown'||event.key==='ArrowUp'){
          event.preventDefault();
          if(listbox.hidden) render('');
          setActive(activeIndex+(event.key==='ArrowDown'?1:-1));
          return;
        }
        if(event.key==='Enter'&&!listbox.hidden&&activeIndex>=0){
          event.preventDefault(); selectRow(visible[activeIndex]);
        }
      });
      input.addEventListener('blur',()=>{
        const schedule=root&&typeof root.setTimeout==='function'?root.setTimeout.bind(root):setTimeout;
        schedule(()=>{ close(); syncFromSelect(); },100);
      });
      select.addEventListener('change',syncFromSelect);
      syncFromSelect();
      select.classList.add('visually-hidden');
      select.setAttribute('aria-hidden','true');
      select.setAttribute('tabindex','-1');
      select.dataset.districtComboboxMounted='true';
      if(root&&typeof root.setTimeout==='function') root.setTimeout(syncFromSelect,0);
      return wrapper;
    }catch(_){
      if(wrapper&&wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      if(select.classList) select.classList.remove('visually-hidden');
      select.removeAttribute&&select.removeAttribute('aria-hidden');
      select.removeAttribute&&select.removeAttribute('tabindex');
      delete select.dataset.districtComboboxMounted;
      return null;
    }
  }

  return {STORAGE_KEY,normalizeSearchText,buildDistrictOptions,filterDistricts,readRecent,writeRecent,mount};
});
