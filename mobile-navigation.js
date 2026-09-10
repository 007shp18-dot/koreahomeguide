(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.KHGMobileNavigation=api;
  if(root&&root.document){
    const start=()=>api.mount({ root, doc:root.document });
    if(root.document.readyState==='loading') root.document.addEventListener('DOMContentLoaded',start,{ once:true });
    else start();
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function buildNavigation({ language='en', pathname='/' }={}){
    const zh=language==='zh-CN'||pathname.startsWith('/zh/');
    const prefix=zh?'/zh':'';
    const items=[
      { key:'rent-check', label:zh?'租金检查':'Rent Check', href:`${prefix}/tools/seoul-rent-check/` },
      { key:'explore', label:zh?'租金探索':'Explore', href:`${prefix}/explore/` },
      { key:'saved', label:zh?'已保存':'Saved', href:`${prefix}/saved-homes/` },
      { key:'guides', label:zh?'指南':'Guides', href:`${prefix}/guides/` }
    ];
    const activeKey=pathname.includes('/saved-homes/')?'saved'
      :pathname.includes('/explore/')?'explore'
      :pathname.includes('/tools/seoul-rent-check/')?'rent-check'
      :pathname.includes('/guides/')?'guides':'';
    return items.map(item=>({ ...item, active:item.key===activeKey }));
  }

  function mount({ root=globalThis, doc=root&&root.document }={}){
    if(!root||!doc||!doc.body||doc.querySelector('[data-khg-mobile-nav]')) return null;
    const language=doc.documentElement&&doc.documentElement.lang==='zh-CN'?'zh-CN':'en';
    const items=buildNavigation({ language, pathname:root.location&&root.location.pathname||'/' });
    const nav=doc.createElement('nav');
    nav.className='mobile-primary-nav';
    nav.dataset.khgMobileNav='true';
    nav.setAttribute('data-khg-mobile-nav','');
    nav.setAttribute('aria-label',language==='zh-CN'?'移动端主导航':'Mobile primary navigation');

    for(const item of items){
      const link=doc.createElement('a');
      link.className=`mobile-primary-nav-link mobile-primary-nav-${item.key}`;
      link.setAttribute('href',item.href);
      link.dataset.navigationTarget=item.key;
      if(item.active) link.setAttribute('aria-current','page');
      const label=doc.createElement('span');
      label.textContent=item.label;
      link.appendChild(label);
      link.addEventListener('click',()=>{
        if(typeof root.gtag==='function') root.gtag('event','mobile_nav_click',{ navigation_target:item.key,language });
      });
      nav.appendChild(link);
    }
    doc.body.appendChild(nav);
    return nav;
  }

  return { buildNavigation, mount };
});
