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
      tabs:['概览','市场','合同'], signed:'近期签约', market:'市场位置', facts:'建筑信息', contracts:'最近合同',
      rent:'月租中位数', deposit:'押金中位数', area:'典型面积', perSqm:'押金校正 ₩/㎡', evidence:'建筑内月租合同',
      dong:'所在街区', district:'所在行政区', limited:'依据有限', profileUnavailable:'建筑登记信息暂不可用。',
      saved:'已收藏', save:'收藏建筑', check:'检查我的报价', full:'打开完整详情', noContracts:'暂无近期合同。',
      source:'韩国国土交通部官方数据', higher:p => `高于 ${p}% 的近期可比合同`, lower:p => `低于 ${p}% 的近期可比合同`, aboveMedian:p => `高于市场中位数 ${p}%`, belowMedian:p => `低于市场中位数 ${p}%`,
      profile:{ year:'使用批准', households:'户', families:'家庭', floors:'地上层数' }
    } : {
      close:'Close building details', loading:'Loading official signed contracts for this building…', error:'Building data is temporarily unavailable.', retry:'Retry',
      tabs:['Overview','Market','Contracts'], signed:'What people signed', market:'Against the market', facts:'Building facts', contracts:'Recent contracts',
      rent:'Median monthly rent', deposit:'Median deposit', area:'Typical size', perSqm:'Deposit-adjusted ₩/㎡', evidence:'monthly-rent contracts in this building',
      dong:'This neighborhood', district:'This district', limited:'Limited evidence', profileUnavailable:'Building registry details are temporarily unavailable.',
      saved:'Saved', save:'Save building', check:'Check my quote', full:'Open full details', noContracts:'No recent contracts are available.',
      source:'Official MOLIT signed-rental data', higher:p => `Higher than ${p}% of comparable recent contracts`, lower:p => `Lower than ${p}% of comparable recent contracts`, aboveMedian:p => `${p}% above the market median`, belowMedian:p => `${p}% below the market median`,
      profile:{ year:'Use approved', households:'households', families:'families', floors:'above-ground floors' }
    };
  }

  function money(value) {
    if (value == null || value === '') return '—';
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    return `₩${Math.round(number).toLocaleString('en-US')}`;
  }

  function perSqmMoney(value) {
    const formatted = money(value);
    return formatted === '—' ? formatted : `${formatted}/㎡`;
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

  function buildDetailApiUrl(selection, legalCode = '') {
    const params = new URLSearchParams({
      lawdCd:String(selection.districtCode || ''),
      type:String(selection.propertyType || ''),
      buildingKey:String(selection.buildingKey || '')
    });
    if (/^\d{10}$/.test(String(legalCode || ''))) params.set('legalCode', String(legalCode));
    return `/api/explore-building?${params.toString()}`;
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

  function positionHtml(label, position, copy, buildingAdjustedPerSqmWon) {
    const sufficient = position && position.status === 'sufficient' && Number.isFinite(Number(position.percentile));
    if (!sufficient) return `<div class="building-market-row"><div><span>${escapeHtml(label)}</span><strong>${escapeHtml(copy.limited)}</strong></div><small>${Number(position && position.comparableCount || 0)} contracts · ${Number(position && position.buildingCount || 0)} buildings</small></div>`;
    const rank = Math.round(Number(position.percentile) * 100);
    const phrase = rank >= 50 ? copy.higher(rank) : copy.lower(100 - rank);
    const marketValue = Number(position.medianAdjustedPerSqmWon);
    const buildingValue = Number(buildingAdjustedPerSqmWon);
    const difference = Number.isFinite(marketValue) && marketValue > 0 && Number.isFinite(buildingValue)
      ? Math.round(Math.abs(buildingValue / marketValue - 1) * 1000) / 10
      : null;
    const relation = difference == null ? phrase : buildingValue >= marketValue ? copy.aboveMedian(difference) : copy.belowMedian(difference);
    const pair = Number.isFinite(marketValue) && Number.isFinite(buildingValue)
      ? `<b class="building-market-pair">${perSqmMoney(buildingValue)} / ${perSqmMoney(marketValue)}</b>`
      : '';
    return `<div class="building-market-row"><div><span>${escapeHtml(label)}</span>${pair}<strong>${escapeHtml(relation)}</strong></div><div class="building-market-gauge" style="--building-position:${rank}%" role="img" aria-label="${escapeHtml(phrase)}"><i></i></div><small>${Number(position.comparableCount || 0)} contracts · ${Number(position.buildingCount || 0)} buildings</small></div>`;
  }

  function renderContent(detail, selection, locale) {
    const copy = copyForLocale(locale);
    const representative = detail && detail.marketPosition && detail.marketPosition.buildingRepresentative;
    const position = detail && detail.marketPosition || {};
    const transactions = Array.isArray(detail && detail.recentTransactions) ? detail.recentTransactions.slice(0, 5) : [];
    const contracts = transactions.length ? transactions.map(row => `<li><time>${escapeHtml(row.contractDate || '—')}</time><span>${row.floor == null ? '—' : `${escapeHtml(row.floor)}F`} · ${Number(row.areaSqm || 0).toFixed(1)}㎡</span><strong>${money(row.depositWon)} + ${money(row.monthlyRentWon)}/mo</strong><b>${perSqmMoney(row.adjustedPerSqmWon)}</b></li>`).join('') : `<li class="is-empty">${escapeHtml(copy.noContracts)}</li>`;
    return `<div class="building-window-grid building-window-stack">
        <section class="building-window-panel building-price-panel"><span class="building-window-kicker">01</span><h3>${escapeHtml(copy.signed)}</h3>
          <dl class="building-snapshot"><div><dt>${escapeHtml(copy.rent)}</dt><dd>${money(representative && representative.monthlyRentWon)}</dd></div><div><dt>${escapeHtml(copy.deposit)}</dt><dd>${money(representative && representative.depositWon)}</dd></div><div><dt>${escapeHtml(copy.area)}</dt><dd>${representative ? `${Number(representative.areaSqm).toFixed(1)}㎡` : '—'}</dd></div><div class="is-key"><dt>${escapeHtml(copy.perSqm)}</dt><dd>${perSqmMoney(representative && representative.adjustedPerSqmWon)}</dd></div></dl>
          <p class="building-status-muted">${representative ? `${Number(representative.contractCount)} ${escapeHtml(copy.evidence)}` : escapeHtml(copy.limited)}</p>
        </section>
        <section class="building-window-panel building-market-stack"><span class="building-window-kicker">02</span><h3>${escapeHtml(copy.market)}</h3>${positionHtml(copy.dong, position.dong, copy, representative && representative.adjustedPerSqmWon)}${positionHtml(copy.district, position.district, copy, representative && representative.adjustedPerSqmWon)}<p class="building-status-muted">${escapeHtml(copy.source)}</p></section>
        <section class="building-window-panel building-window-profile"><span class="building-window-kicker">03</span><h3>${escapeHtml(copy.facts)}</h3>${profileHtml(detail && detail.profile, copy)}</section>
        <section class="building-window-panel building-contract-panel"><span class="building-window-kicker">04</span><h3>${escapeHtml(copy.contracts)}</h3><ol class="building-contract-list">${contracts}</ol></section>
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
    overlay.innerHTML = `<section class="building-status-window" role="complementary" aria-modal="false" aria-labelledby="buildingStatusTitle"><header class="building-status-head"><div class="building-status-identity"><span id="buildingStatusMeta" class="eyebrow"></span><h2 id="buildingStatusTitle"></h2><p id="buildingStatusAddress"></p><div id="buildingStatusProfile"></div></div><button type="button" class="building-status-close" aria-label="${escapeHtml(copy.close)}">×</button></header><section id="explorerStreetView" class="explorer-street-view building-window-street-view" aria-labelledby="explorerStreetViewHeading" hidden><div class="explorer-street-view-head"><strong id="explorerStreetViewHeading">${isZh(locale) ? '该建筑附近街景' : 'Street view near this building'}</strong><span id="explorerStreetViewMeta"></span></div><div id="explorerStreetViewFrame" class="building-window-media-frame"><div class="building-window-loading-visual" aria-hidden="true"></div><div id="explorerStreetViewCanvas" class="explorer-street-view-canvas" hidden></div><p id="explorerStreetViewStatus" aria-live="polite"></p></div><small>${isZh(locale) ? '附近街景，并非出租房源照片。' : 'Nearby street view, not a listing photo.'}</small></section><div id="buildingStatusBody" class="building-status-body"></div><footer class="building-status-actions"><button type="button" data-building-save>${escapeHtml(copy.save)}</button><a data-building-rent-check href="#">${escapeHtml(copy.check)} →</a><a data-building-full href="#">${escapeHtml(copy.full)} →</a></footer></section>`;
    doc.body.appendChild(overlay);
    const dialog = overlay.querySelector('.building-status-window');
    const body = overlay.querySelector('#buildingStatusBody');
    const streetView = overlay.querySelector('#explorerStreetView');
    const layoutQuery = windowObject.matchMedia && windowObject.matchMedia('(max-width: 860px)');
    const cache = new Map();
    const store = windowObject.KHGSavedExplorerBuildings ? windowObject.KHGSavedExplorerBuildings.createStore(windowObject.localStorage) : null;
    let current = null;
    let currentDetail = null;
    let pendingLegalCode = '';
    let trigger = null;
    let requestId = 0;

    function syncLayout() {
      const mobile = Boolean(layoutQuery && layoutQuery.matches);
      dialog.setAttribute('role', mobile ? 'dialog' : 'complementary');
      dialog.setAttribute('aria-modal', String(mobile));
      doc.body.classList.toggle('has-building-status-window', mobile && !overlay.hidden);
    }
    if (layoutQuery && typeof layoutQuery.addEventListener === 'function') layoutQuery.addEventListener('change', syncLayout);

    function close() {
      if (overlay.hidden) return;
      const selection = current;
      requestId += 1; overlay.hidden = true; overlay.dataset.state = 'closed'; doc.body.classList.remove('has-building-status-window');
      windowObject.dispatchEvent(new CustomEvent('khg:building-window-state', { detail:{ open:false, selection } }));
      windowObject.dispatchEvent(new CustomEvent('khg:building-window-close'));
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
    }
    function updateSave() {
      const button = overlay.querySelector('[data-building-save]');
      if (button) button.textContent = store && current && store.has(current.buildingKey) ? copy.saved : copy.save;
    }
    function cacheKey(selection, legalCode = '') {
      return `${selection.districtCode}:${selection.propertyType}:${selection.buildingKey}:${legalCode}`;
    }
    function fetchDetail(selection, legalCode = '') {
      const key = cacheKey(selection, legalCode);
      if (!cache.has(key)) {
        cache.set(key, windowObject.fetch(buildDetailApiUrl(selection, legalCode), { headers:{ Accept:'application/json' } }).then(async response => {
          const data = await response.json(); if (!response.ok) throw new Error(data.error || 'detail'); return data;
        }).catch(error => { cache.delete(key); throw error; }));
      }
      return cache.get(key);
    }
    function renderDetail(detail, selection) {
      const address = detail.profile && (detail.profile.roadAddress || detail.profile.officialAddress) || detail.mapLocation && (detail.mapLocation.roadAddress || detail.mapLocation.jibun) || selection.roadAddress || selection.jibun || '';
      overlay.querySelector('#buildingStatusAddress').textContent = address;
      overlay.querySelector('#buildingStatusProfile').innerHTML = profileHtml(detail.profile, copy);
      body.innerHTML = renderContent(detail, selection, locale);
      overlay.querySelector('[data-building-rent-check]').href = buildRentCheckUrl(selection, detail, locale);
      syncLayout();
    }
    async function enrichCurrentProfile() {
      const selection = current;
      const legalCode = pendingLegalCode;
      const enrichmentRequest = requestId;
      if (!selection || !currentDetail || !legalCode || currentDetail.profile && currentDetail.profile.status === 'matched') return;
      try {
        const enriched = await fetchDetail(selection, legalCode);
        if (enrichmentRequest !== requestId || current !== selection) return;
        currentDetail = enriched;
        renderDetail(enriched, selection);
      } catch (_) {
        // The signed-rent detail remains usable when the optional registry lookup fails.
      }
    }
    async function open(selection, source) {
      if (!selection || !selection.buildingKey) return;
      current = selection; currentDetail = null; pendingLegalCode = ''; trigger = source || doc.activeElement; const currentRequest = ++requestId;
      overlay.dataset.state = 'preparing';
      windowObject.dispatchEvent(new CustomEvent('khg:building-window-reset', { detail:{ selection } }));
      overlay.querySelector('#buildingStatusTitle').textContent = selection.label || selection.buildingName || selection.buildingKey;
      overlay.querySelector('#buildingStatusMeta').textContent = [selection.dong, selection.districtName, selection.propertyType].filter(Boolean).join(' · ');
      overlay.querySelector('#buildingStatusAddress').textContent = selection.roadAddress || selection.jibun || '';
      overlay.querySelector('#buildingStatusProfile').innerHTML = '';
      body.innerHTML = `<div class="building-window-loading"><div class="building-window-loading-lines" aria-hidden="true"><i></i><i></i><i></i><i></i></div><p>${escapeHtml(copy.loading)}</p></div>`;
      overlay.querySelector('[data-building-full]').href = buildDetailUrl(selection, locale);
      overlay.querySelector('[data-building-rent-check]').href = buildRentCheckUrl(selection, null, locale);
      updateSave();
      overlay.dataset.state = 'loading';
      overlay.hidden = false; syncLayout();
      windowObject.dispatchEvent(new CustomEvent('khg:building-window-state', { detail:{ open:true, selection } }));
      overlay.querySelector('.building-status-close').focus();
      windowObject.dispatchEvent(new CustomEvent('khg:building-window-location-request', { detail:{ selection } }));
      try {
        const detail = await fetchDetail(selection);
        if (currentRequest !== requestId) return;
        currentDetail = detail;
        renderDetail(detail, selection);
        overlay.dataset.state = 'ready';
        void enrichCurrentProfile();
      } catch (_) {
        if (currentRequest !== requestId) return;
        overlay.dataset.state = 'error';
        body.innerHTML = `<div class="building-window-error"><p>${escapeHtml(copy.error)}</p><button type="button" data-building-retry>${escapeHtml(copy.retry)}</button></div>`;
      }
    }
    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target.closest('.building-status-close')) { close(); return; }
      if (event.target.closest('[data-building-retry]')) { const selection = current; for (const key of cache.keys()) if (key.startsWith(`${selection.districtCode}:${selection.propertyType}:${selection.buildingKey}:`)) cache.delete(key); void open(selection, trigger); return; }
      if (event.target.closest('[data-building-save]') && store && current) {
        store.toggle(current); updateSave();
      }
    });
    doc.addEventListener('keydown', event => {
      if (overlay.hidden) return;
      if (event.key === 'Escape') { close(); return; }
      if (event.key === 'Tab' && layoutQuery && layoutQuery.matches) {
        const focusable = [...dialog.querySelectorAll('button:not([disabled]),a[href],select,input,[tabindex]:not([tabindex="-1"])')].filter(element => !element.hidden);
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && doc.activeElement === first) { last.focus(); event.preventDefault(); }
        else if (!event.shiftKey && doc.activeElement === last) { first.focus(); event.preventDefault(); }
      }
    });
    windowObject.addEventListener('khg:building-window-open', event => { void open(event.detail && event.detail.selection, event.detail && event.detail.trigger); });
    windowObject.addEventListener('khg:map-select-building', event => { void open(event.detail && event.detail.model, null); });
    windowObject.addEventListener('khg:building-window-legal-code', event => {
      const detail = event.detail || {};
      const model = detail.model || {};
      const legalCode = String(detail.legalCode || '');
      if (!current || model.buildingKey !== current.buildingKey || model.dong !== current.dong) return;
      if (!new RegExp(`^${current.districtCode}\\d{5}$`).test(legalCode)) return;
      pendingLegalCode = legalCode;
      void enrichCurrentProfile();
    });
    return Object.freeze({ open, close });
  }

  return Object.freeze({ escapeHtml, copyForLocale, buildDetailUrl, buildRentCheckUrl, buildDetailApiUrl, selectionFromBuilding, renderContent, install });
});
