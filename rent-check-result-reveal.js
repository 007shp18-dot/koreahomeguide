(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.KHGRentCheckResultReveal=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  function reveal(element,windowObject){
    const viewport=windowObject||(typeof window!=='undefined'?window:null);
    if(!element||typeof element.scrollIntoView!=='function'||!viewport)return false;
    const width=Number(viewport.innerWidth);
    if(!Number.isFinite(width)||width>760)return false;
    const reduceMotion=Boolean(
      typeof viewport.matchMedia==='function'&&
      viewport.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    element.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});
    return true;
  }

  return Object.freeze({reveal});
});
