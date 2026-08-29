(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.KHGExplorerBuildingWindow = api;
    if (root.document && root.addEventListener) api.install(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
  }

  function isZh(locale) { return String(locale || '').toLowerCase().startsWith('zh'); }
  function copyForLocale(locale) {
    return isZh(locale) ? {
      close:'关闭建筑详情', loading:'正在读取该建筑的官方签约数据…', error:'建筑数据暂时无法读取。', retry:'重试',
      tabs:['概览','市场','合同'], signed:'近期签约', market:'市场位置', contracts:'最近合同',
      rent:'月租中位数', deposit:'押金中位数', area:'典型面积', evidence:'建筑内月租合同',
      dong:'所在街区', district:'所在行政区', limited:'依据有限', profileUnavailable:'建筑登记信息暂不可用。',
      saved:'已收藏', save:'收藏建筑', check:'检查我的报价', full:'打开完整详情', noContracts:'暂无近期合同。',
      source:'韩国国土交通部官方数据', higher:p => `高于 ${p}% 的近期可比合同`, lower:p => `低于 ${p}% 的近期可比合同`,
      profile:{ year:'使用批准', households:'户', families:'家庭', floors:'地上层数' }
    } : {
      close:'Close building details', loading:'Loading official signed contracts for this building…', error:'Building data is temporarily unavailable.', retry:'Retry',
      tabs:['Overview','Market','Contracts'], signed:'What people signed', market:'Against the market', contracts:'Recent contracts',
      rent:'Median monthly rent', deposit:'Median deposit', area:'Typical size', evidence:'monthly-rent contracts in this building',
      dong:'This neighborhood', district:'This district', limited:'Limited evidence', profileUnavailable:'Building registry details are temporarily unavailable.',
      saved:'Saved', save:'Save building', check:'Check my quote', full:'Open full details', noContracts:'No recent contracts are available.',
      source:'Official MOLIT signed-rental data', higher:p => `Higher than ${p}% of comparable recent contracts`, lower:p => `Lower than ${p}% of comparable recent contracts`,
      profile:{ year:'Use approved', households:'households', families:'families', floors:'above-ground floors' }
    };
  }

  function money(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    return `₩${Math.round(number).toLocaleString('en-US')}`;
  }

  function buildDetailUrl(selection, locale) {
    const params = new URLSearchParams({ lawdCd:String(selection.districtCode || ''), type:String(selection.propertyType || '') });
    if (selection.dong) params.set('dong', selection.dong);
    params.set('buildingKey', String(selection.buildingKey || ''));
    return `${isZh(locale) ? '/zh' : ''}/explore/building/?${params.toString()}`;
  }

  function buildRentCheckUrl(selection, detail, locale) {
    const params = new URLSearchParams({ lawdCd:String(selection.districtCode || ''), type:String(selection.propertyType || '') });
    const representative = detail && detail.marketPosition && detail.marketPosition.buildingRepresentative;
    if (representative && Number.isFinite(Number(representative.areaSqm))) params.set('area', String(representative.areaSqm));
    return `${isZh(locale) ? '/zh' : ''}/tools/seoul-rent-check/?${params.toString()}`;
  }

  function selectionFromBuilding(item, context = {}) {
    const mapLocation = item && item.mapLocation && typeof item.mapLocation === 'object' ? item.mapLocation : null;
    const zh = isZh(context.locale);
    return {
      kind:'building',
      buildingKey:String(item && item.buildingKey || ''),
      buildingName:String(item && item.buildingName || ''),
      label:String(item && (zh ? item.displayBuildingNameZh : item.displayBuildingNameEn) || item && item.buildingName || ''),
      secondaryLabel:String(item && item.officialBuildingNameKo || ''),
      dong:String(item && item.dong || ''),
      propertyType:String(item && item.propertyType || context.propertyType || ''),
      districtCode:String(context.districtCode || ''),
      districtName:String(context.districtName || ''),
      roadAddress:String(mapLocation && mapLocation.roadAddress || ''),
      jibun:String(mapLocation && mapLocation.jibun || ''),
      mapLocation
    };
  }

  function profileHtml(profile, copy) {
    if (!profile || profile.status !== 'matched') return `<p class="building-status-muted">${escapeHtml(copy.profileUnavailable)}</p>`;
    const facts = [];
    if (profile.useApprovalYear) facts.push(`<span><b>${escapeHtml(profile.useApprovalYear)}</b>${escapeHtml(copy.profile.year)}</span>`);
    if (profile.householdCount) facts.push(`<span><b>${escapeHtml(profile.householdCount)}</b> ${escapeHtml(copy.profile[profile.householdLabel] || profile.householdLabel)}</span>`);
    if (profile.groundFloors) facts.push(`<span><b>${escapeHtml(profile.groundFloors)}</b>${escapeHtml(copy.profile.floors)}</span>`);
    return facts.length ? `<div class="building-profile-facts">${facts.join('')}</div>` : `<p class="building-status-muted">${escapeHtml(copy.profileUnavailable)}</p>`;
  }

  function positionHtml(label, position, copy) {
    const sufficient = position && position.status === 'sufficient' && Number.isFinite(Number(position.percentile));
    if (!sufficient) return `<div class="building-market-row"><div><span>${escapeHtml(label)}</span><strong>${escapeHtml(copy.limited)}</strong></div><small>${Number(position && position.comparableCount || 0)} contracts · ${Number(position && position.buildingCount || 0)} buildings</small></div>`;
    const rank = Math.round(Number(position.percentile) * 100);
    const phrase = rank >= 50 ? copy.higher(rank) : copy.lower(100 - rank);
    return `<div class="building-market-row"><div><span>${escapeHtml(label)}</span><strong>${escapeHtml(phrase)}</strong></div><div class="building-market-gauge" style="--building-position:${rank}%" role="img" aria-label="${escapeHtml(phrase)}"><i></i></div><small>${Number(position.comparableCount || 0)} contracts · ${Number(position.buildingCount || 0)} buildings</small></div>`;
  }

  function renderContent(detail, selection, locale) {
    const copy = copyForLocale(locale);
    const representative = detail && detail.marketPosition && detail.marketPosition.buildingRepresentative;
    const position = detail && detail.marketPosition || {};
    const transactions = Array.isArray(detail && detail.recentTransactions) ? detail.recentTransactions.slice(0, 5) : [];
    const contracts = transactions.length ? transactions.map(row => `<li><time>${escapeHtml(row.contractDate || '—')}</time><span>${row.floor == null ? '—' : `${escapeHtml(row.floor)}F`} · ${Number(row.areaSqm || 0).toFixed(1)}㎡</span><strong>${money(row.depositWon)} + ${money(row.monthlyRentWon)}/mo</strong></li>`).join('') : `<li class="is-empty">${escapeHtml(copy.noContracts)}</li>`;
    return `<div class="building-window-tabs" role="tablist" aria-label="${escapeHtml(copy.market)}">${copy.tabs.map((tab, index) => `<button type="button" role="tab" id="buildingWindowTab${index}" aria-controls="buildingWindowPanel${index}" aria-selected="${index === 0}" data-building-tab="${index}">${escapeHtml(tab)}</button>`).join('')}</div>
      <div class="building-window-grid">
        <section id="buildingWindowPanel0" class="building-window-panel" role="tabpanel" aria-labelledby="buildingWindowTab0" data-building-panel="0"><span class="building-window-kicker">01</span><h3>${escapeHtml(copy.signed)}</h3>
          <dl class="building-snapshot"><div><dt>${escapeHtml(copy.rent)}</dt><dd>${money(representative && representative.monthlyRentWon)}</dd></div><div><dt>${escapeHtml(copy.deposit)}</dt><dd>${money(representative && representative.depositWon)}</dd></div><div><dt>${escapeHtml(copy.area)}</dt><dd>${representative ? `${Number(representative.areaSqm).toFixed(1)}㎡` : '—'}</dd></div></dl>
          <p class="building-status-muted">${representative ? `${Number(representative.contractCount)} ${escapeHtml(copy.evidence)}` : escapeHtml(copy.limited)}</p>
          <div class="building-window-profile">${profileHtml(detail && detail.profile, copy)}</div>
        </section>
        <section id="buildingWindowPanel1" class="building-window-panel" role="tabpanel" aria-labelledby="buildingWindowTab1" data-building-panel="1"><span class="building-window-kicker">02</span><h3>${escapeHtml(copy.market)}</h3>${positionHtml(copy.dong, position.dong, copy)}${positionHtml(copy.district, position.district, copy)}<p class="building-status-muted">${escapeHtml(copy.source)}</p></section>
        <section id="buildingWindowPanel2" class="building-window-panel" role="tabpanel" aria-labelledby="buildingWindowTab2" data-building-panel="2"><span class="building-window-kicker">03</span><h3>${escapeHtml(copy.contracts)}</h3><ol class="building-contract-list">${contracts}</ol></section>
      </div>`;
  }

  function install(windowObject) {
    const doc = windowObject.document;
    const locale = doc.documentElement.lang || 'en';
    const copy = copyForLocale(locale);
    const overlay = doc.createElement('div');
    overlay.id = 'buildingStatusOverlay';
    overlay.className = 'building-status-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `<section class="building-status-window" role="dialog" aria-modal="true" aria-labelledby="buildingStatusTitle"><header class="building-status-head"><div class="building-status-identity"><span id="buildingStatusMeta" class="eyebrow"></span><h2 id="buildingStatusTitle"></h2><p id="buildingStatusAddress"></p><div id="buildingStatusProfile"></div></div><section id="explorerStreetView" class="explorer-street-view building-window-street-view" aria-labelledby="explorerStreetViewHeading" hidden><div class="explorer-street-view-head"><strong id="explorerStreetViewHeading">${isZh(locale) ? '该建筑附近街景' : 'Street view near this building'}</strong><span id="explorerStreetViewMeta"></span></div><div id="explorerStreetViewCanvas" class="explorer-street-view-canvas" hidden></div><p id="explorerStreetViewStatus" aria-live="polite"></p><small>${isZh(locale) ? '附近街景，并非出租房源照片。' : 'Nearby street view, not a listing photo.'}</small></section><button type="button" class="building-status-close" aria-label="${escapeHtml(copy.close)}">×</button></header><div id="buildingStatusBody" class="building-status-body"></div><footer class="building-status-actions"><button type="button" data-building-save>${escapeHtml(copy.save)}</button><a data-building-rent-check href="#">${escapeHtml(copy.check)} →</a><a data-building-full href="#">${escapeHtml(copy.full)} →</a></footer></section>`;
    doc.body.appendChild(overlay);
    const dialog = overlay.querySelector('.building-status-window');
    const body = overlay.querySelector('#buildingStatusBody');
    const cache = new Map();
    const store = windowObject.KHGSavedExplorerBuildings ? windowObject.KHGSavedExplorerBuildings.createStore(windowObject.localStorage) : null;
    let current = null;
    let trigger = null;
    let requestId = 0;

    function close() {
      if (overlay.hidden) return;
      requestId += 1; overlay.hidden = true; doc.body.classList.remove('has-building-status-window');
      windowObject.dispatchEvent(new CustomEvent('khg:building-window-close'));
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
    }
    function setTab(index) {
      overlay.querySelectorAll('[data-building-tab]').forEach((button, buttonIndex) => button.setAttribute('aria-selected', String(buttonIndex === index)));
      const mobile = windowObject.matchMedia && windowObject.matchMedia('(max-width: 860px)').matches;
      overlay.querySelectorAll('[data-building-panel]').forEach((panel, panelIndex) => panel.hidden = mobile && panelIndex !== index);
    }
    function updateSave() {
      const button = overlay.querySelector('[data-building-save]');
      if (button) button.textContent = store && current && store.has(current.buildingKey) ? copy.saved : copy.save;
    }
    async function open(selection, source) {
      if (!selection || !selection.buildingKey) return;
      current = selection; trigger = source || doc.activeElement; const currentRequest = ++requestId;
      overlay.hidden = false; doc.body.classList.add('has-building-status-window');
      overlay.querySelector('#buildingStatusTitle').textContent = selection.label || selection.buildingName || selection.buildingKey;
      overlay.querySelector('#buildingStatusMeta').textContent = [selection.dong, selection.districtName, selection.propertyType].filter(Boolean).join(' · ');
      overlay.querySelector('#buildingStatusAddress').textContent = selection.roadAddress || selection.jibun || '';
      overlay.querySelector('#buildingStatusProfile').innerHTML = '';
      body.innerHTML = `<div class="building-window-loading"><span></span><p>${escapeHtml(copy.loading)}</p></div>`;
      overlay.querySelector('[data-building-full]').href = buildDetailUrl(selection, locale);
      overlay.querySelector('[data-building-rent-check]').href = buildRentCheckUrl(selection, null, locale);
      updateSave(); overlay.querySelector('.building-status-close').focus();
      windowObject.dispatchEvent(new CustomEvent('khg:building-window-location-request', { detail:{ selection } }));
      try {
        const key = `${selection.districtCode}:${selection.propertyType}:${selection.buildingKey}`;
        if (!cache.has(key)) {
          const params = new URLSearchParams({ lawdCd:selection.districtCode, type:selection.propertyType, buildingKey:selection.buildingKey });
          cache.set(key, windowObject.fetch(`/api/explore-building?${params.toString()}`, { headers:{ Accept:'application/json' } }).then(async response => {
            const data = await response.json(); if (!response.ok) throw new Error(data.error || 'detail'); return data;
          }).catch(error => { cache.delete(key); throw error; }));
        }
        const detail = await cache.get(key);
        if (currentRequest !== requestId) return;
        const address = detail.profile && (detail.profile.roadAddress || detail.profile.officialAddress) || detail.mapLocation && (detail.mapLocation.roadAddress || detail.mapLocation.jibun) || selection.roadAddress || selection.jibun || '';
        overlay.querySelector('#buildingStatusAddress').textContent = address;
        overlay.querySelector('#buildingStatusProfile').innerHTML = profileHtml(detail.profile, copy);
        body.innerHTML = renderContent(detail, selection, locale);
        overlay.querySelector('[data-building-rent-check]').href = buildRentCheckUrl(selection, detail, locale);
        setTab(0);
      } catch (_) {
        if (currentRequest !== requestId) return;
        body.innerHTML = `<div class="building-window-error"><p>${escapeHtml(copy.error)}</p><button type="button" data-building-retry>${escapeHtml(copy.retry)}</button></div>`;
      }
    }
    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('.building-status-close')) { close(); return; }
      const tab = event.target.closest('[data-building-tab]');
      if (tab) { setTab(Number(tab.dataset.buildingTab)); return; }
      if (event.target.closest('[data-building-retry]')) { const selection = current; cache.delete(`${selection.districtCode}:${selection.propertyType}:${selection.buildingKey}`); void open(selection, trigger); return; }
      if (event.target.closest('[data-building-save]') && store && current) {
        store.toggle(current); updateSave();
      }
    });
    doc.addEventListener('keydown', event => {
      if (overlay.hidden) return;
      if (event.key === 'Escape') { close(); return; }
      const selectedTab = event.target.closest && event.target.closest('[data-building-tab]');
      if (selectedTab && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
        const tabs = [...overlay.querySelectorAll('[data-building-tab]')];
        const currentIndex = tabs.indexOf(selectedTab);
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        setTab(nextIndex); tabs[nextIndex].focus(); event.preventDefault(); return;
      }
      if (event.key === 'Tab') {
        const focusable = [...dialog.querySelectorAll('button:not([disabled]),a[href],select,input,[tabindex]:not([tabindex="-1"])')].filter(element => !element.hidden);
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && doc.activeElement === first) { last.focus(); event.preventDefault(); }
        else if (!event.shiftKey && doc.activeElement === last) { first.focus(); event.preventDefault(); }
      }
    });
    windowObject.addEventListener('khg:building-window-open', event => { void open(event.detail && event.detail.selection, event.detail && event.detail.trigger); });
    windowObject.addEventListener('khg:map-select-building', event => { void open(event.detail && event.detail.model, null); });
    return Object.freeze({ open, close });
  }

  return Object.freeze({ escapeHtml, copyForLocale, buildDetailUrl, buildRentCheckUrl, selectionFromBuilding, renderContent, install });
});
