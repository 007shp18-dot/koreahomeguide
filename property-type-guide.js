(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.KHGPropertyTypeGuide = api;
    if (root.document) api.install(root.document);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const COPY = Object.freeze({
    en:Object.freeze({
      apartment:'Managed apartment complex; registered as 아파트.',
      officetel:'Mixed-use building often rented as compact housing; registered as 오피스텔.',
      villa:'Low-rise multifamily housing registered as 연립·다세대.',
      detached:'Detached or multi-household housing registered as 단독·다가구.',
      studio:'A room layout, not an official transaction category; choose the registered type when known.'
    }),
    zh:Object.freeze({
      apartment:'有统一物业管理的公寓住宅，登记类型为 아파트。',
      officetel:'常用于居住的办公住宅两用楼，登记类型为 오피스텔。',
      villa:'低层多户住宅，登记类型为 연립·다세대。',
      detached:'独栋或多户住宅，登记类型为 단독·다가구。',
      studio:'“单间”是户型而非官方成交分类；如知道登记类型，请按登记类型选择。'
    })
  });

  function localeKey(locale) {
    return String(locale || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }

  function descriptionFor(type, locale = 'en') {
    return COPY[localeKey(locale)][String(type || '')] || '';
  }

  function install(documentObject) {
    documentObject.querySelectorAll('[data-property-type-guide]').forEach(element => {
      const select = documentObject.getElementById(element.dataset.for || '');
      if (!select) return;
      const update = () => { element.textContent = descriptionFor(select.value, element.dataset.locale || documentObject.documentElement.lang); };
      select.addEventListener('change', update);
      update();
    });
  }

  return Object.freeze({ descriptionFor, install });
});
