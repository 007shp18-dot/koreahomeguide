(function() {
  'use strict';
  const canvas = document.querySelector('#explorerMap');
  const status = document.querySelector('#explorerMapStatus');
  const backButton = document.querySelector('#explorerMapBack');
  const searchAreaButton = document.querySelector('#explorerSearchArea');
  const selectionPanel = document.querySelector('#explorerMapSelection');
  const selectionDrag = document.querySelector('#explorerMapSelectionDrag');
  if (!canvas || !status) return;

  const zh = String(document.documentElement.lang || '').toLowerCase().startsWith('zh');
  const copy = zh ? {
    loading:'正在加载地图…', disabled:'地图暂时不可用；街区卡片仍可正常使用。',
    unavailable:'地图暂时不可用；请使用下方街区卡片。', ready:n => `地图显示 ${n} 个街区中心点。`, empty:'当前条件下没有可显示的街区中心点。',
    strong:'较强依据', limited:'有限依据', outside:'超出预算',
    locating:'正在核验建筑位置…', readyBuildings:(shown, total) => `显示 ${shown} 个已核验建筑位置（共 ${total} 个近期建筑）。`, noBuildings:'没有可安全核验的建筑位置；继续显示街区中心点。', noAreaBuildings:'当前地图区域内没有已核验建筑。', searchArea:'搜索此区域', searchingArea:'正在搜索此区域…'
  } : {
    loading:'Loading map…', disabled:'Map temporarily unavailable. Neighborhood cards still work.',
    unavailable:'Map temporarily unavailable. Use the neighborhood cards below.', ready:n => `Showing ${n} neighborhood centers.`, empty:'No mapped neighborhood centers match this selection.',
    strong:'Strong evidence', limited:'Limited evidence', outside:'Outside budget',
    locating:'Verifying building locations…', readyBuildings:(shown, total) => `Showing ${shown} verified locations from ${total} recent buildings.`, noBuildings:'No building locations could be safely verified. Neighborhood centers remain visible.', noAreaBuildings:'No verified buildings were found in this map area.', searchArea:'Search this area', searchingArea:'Searching this area…'
  };

  let map = null;
  let markers = [];
  let latest = { lawdCd:'11680', locale:zh ? 'zh-CN' : 'en', dongs:[] };
  let latestBuildings = [];
  let latestBuildingTotal = 0;
  let latestBuildingAttemptedCount = 0;
  let latestBuildingDetail = null;
  let markerScope = 'neighborhood';
  let started = false;
  let selectedMarkerId = '';
  let latestModels = [];
  let viewTracked = false;
  let useAdvancedMarkers = false;
  let geocoder = null;
  let buildingLayerRequestId = 0;
  let panelDrag = null;
  const geocodeCache = new Map();
  const knownBuildingPoints = new Map();
  const attemptedBuildingKeys = new Set();
  const MAX_BUILDING_MARKERS = 60;
  const MAX_BUILDING_GEOCODE_ATTEMPTS = 180;

  function browserPointStorage() {
    try { return window.localStorage; } catch (_) { return null; }
  }

  function mobileMapLayout() {
    return Boolean(window.matchMedia && window.matchMedia('(max-width: 760px)').matches);
  }

  function buildingViewportPadding() {
    const mobile = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;
    const panelVisible = selectionPanel && !selectionPanel.hidden;
    if (mobile) return { top:70, right:44, bottom:panelVisible ? 230 : 80, left:44 };
    return { top:80, right:80, bottom:100, left:panelVisible ? 460 : 80 };
  }

  function capBuildingZoom() {
    if (!map || markerScope !== 'building' || typeof map.getZoom !== 'function') return;
    const zoom = Number(map.getZoom());
    if (Number.isFinite(zoom) && zoom > 15) map.setZoom(15);
  }

  function clampPanelPosition(left, top) {
    if (!selectionPanel || !selectionPanel.parentElement) return null;
    const surface = selectionPanel.parentElement.getBoundingClientRect();
    const panel = selectionPanel.getBoundingClientRect();
    const width = Math.min(panel.width, Math.max(0, surface.width - 16));
    const height = Math.min(panel.height, Math.max(0, surface.height - 16));
    return {
      left:Math.min(Math.max(8, left), Math.max(8, surface.width - width - 8)),
      top:Math.min(Math.max(8, top), Math.max(8, surface.height - height - 8)),
      width
    };
  }

  function moveSelectionPanel(left, top) {
    const position = clampPanelPosition(left, top);
    if (!position) return;
    selectionPanel.classList.add('is-user-positioned');
    selectionPanel.style.left = `${position.left}px`;
    selectionPanel.style.top = `${position.top}px`;
    selectionPanel.style.right = 'auto';
    selectionPanel.style.bottom = 'auto';
    selectionPanel.style.width = `${position.width}px`;
  }

  function keepSelectionPanelInMap() {
    if (mobileMapLayout()) { resetSelectionPanelPosition(); return; }
    if (!selectionPanel || !selectionPanel.classList.contains('is-user-positioned')) return;
    moveSelectionPanel(parseFloat(selectionPanel.style.left) || 8, parseFloat(selectionPanel.style.top) || 8);
  }

  function resetSelectionPanelPosition() {
    if (!selectionPanel) return;
    selectionPanel.classList.remove('is-user-positioned');
    for (const property of ['left','top','right','bottom','width']) selectionPanel.style.removeProperty(property);
  }

  function clearMarkers() {
    markers.forEach(entry => {
      if (entry.advanced) entry.marker.map = null;
      else entry.marker.setMap(null);
    });
    markers = [];
  }

  function markerIcon(model, selected) {
    return {
      path:google.maps.SymbolPath.CIRCLE,
      ...KHGMapController.markerVisual(model, selected)
    };
  }

  function createAdvancedMarkerBadge(model, selected) {
    const badge = document.createElement('span');
    badge.className = `explorer-map-marker-badge${model.kind === 'building' ? ' is-building-marker' : ''}`;
    KHGMapController.applyAdvancedMarkerBadge(badge, model, selected);
    return badge;
  }

  function updateMarkerVisual(entry, selected) {
    if (entry.advanced) {
      KHGMapController.applyAdvancedMarkerBadge(entry.pin, entry.model, selected);
      entry.marker.zIndex = selected ? 1000 : 1;
      return;
    }
    entry.marker.setZIndex(selected ? 1000 : undefined);
    entry.marker.setIcon(markerIcon(entry.model, selected));
  }

  function safeTrack(name, context) {
    try {
      const params = KHGMapController.buildMapAnalyticsEvent(name, context);
      if (!params || typeof window.gtag !== 'function') return false;
      window.gtag('event', name, params);
      return true;
    } catch (_) {
      return false;
    }
  }

  function analyticsContext(models, model = null) {
    const limits = latest.limits || {};
    const hasBudget = Boolean(Number(limits.maxRent || 0) || Number(limits.maxDeposit || 0));
    return {
      locale:latest.locale,
      lawdCd:model ? model.districtCode : latest.lawdCd,
      propertyType:latest.propertyType,
      markerScope:model && model.kind === 'building' ? 'building' : markerScope,
      hasBudget,
      markerCount:models.length,
      fittingCount:models.filter(item => item.budgetStatus !== 'outside').length,
      budgetStatus:model && model.budgetStatus,
      evidenceLevel:model && model.evidenceLevel,
      pageLocation:window.location.href
    };
  }

  function trackView(models) {
    if (!viewTracked && models.length) viewTracked = safeTrack('explorer_map_view', analyticsContext(models));
  }

  function highlight(identifier, pan) {
    const value = String(identifier || '');
    selectedMarkerId = value && !value.includes(':') ? `dong:${value}` : value;
    markers.forEach(entry => {
      const selected = entry.model.id === selectedMarkerId;
      updateMarkerVisual(entry, selected);
    });
    const entry = markers.find(item => item.model.id === selectedMarkerId);
    if (entry && pan && map) map.panTo({ lat:entry.model.lat, lng:entry.model.lng });
  }

  function renderMarkers({ fitViewport = true } = {}) {
    if (!map || !window.KHGMapController) return;
    clearMarkers();
    const models = markerScope === 'building'
      ? KHGMapController.buildBuildingMarkerModels({ ...latest, buildings:latestBuildings })
      : KHGMapController.buildMarkerModels(latest);
    latestModels = models;
    const districtCenter = KHGMapLocations.centerFor(latest.lawdCd, '');
    if (!models.length) {
      if (fitViewport && districtCenter) { map.setCenter(districtCenter); map.setZoom(12); }
      status.textContent = markerScope === 'building' ? copy.noBuildings : copy.empty;
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    markers = models.map(model => {
      const position = { lat:model.lat, lng:model.lng };
      const title = `${model.label} · ${copy[model.tone]} · ${model.contractCount}`;
      let marker;
      let pin = null;
      if (useAdvancedMarkers) {
        pin = createAdvancedMarkerBadge(model, false);
        marker = new google.maps.marker.AdvancedMarkerElement({ map, position, title, zIndex:1, gmpClickable:true });
        marker.append(pin);
      } else {
        const pinVisual = KHGMapController.advancedPinVisual(model, false);
        marker = new google.maps.Marker({
          map,
          position,
          title,
          icon:markerIcon(model, false),
          label:pinVisual.glyphText ? { text:pinVisual.glyphText, color:'#ffffff', fontSize:pinVisual.glyphFontSize, fontWeight:'700' } : undefined
        });
      }
      bounds.extend(position);
      const selectMarker = () => {
        highlight(model.id, false);
        safeTrack('explorer_map_select', analyticsContext(models, model));
        const eventName = model.kind === 'building' ? 'khg:map-select-building' : 'khg:map-select-dong';
        window.dispatchEvent(new CustomEvent(eventName, { detail:{ dong:model.dong, model } }));
      };
      if (useAdvancedMarkers) marker.addEventListener('gmp-click', selectMarker);
      else marker.addListener('click', selectMarker);
      return { model, marker, pin, advanced:useAdvancedMarkers };
    });
    if (fitViewport && models.length === 1) {
      map.setCenter({ lat:models[0].lat, lng:models[0].lng });
      map.setZoom(14);
    } else if (fitViewport && markerScope === 'building') {
      map.fitBounds(bounds, buildingViewportPadding());
      if (google.maps.event && typeof google.maps.event.addListenerOnce === 'function') {
        google.maps.event.addListenerOnce(map, 'idle', capBuildingZoom);
      } else window.setTimeout(capBuildingZoom, 0);
    } else if (fitViewport) map.fitBounds(bounds, 34);
    highlight(selectedMarkerId, false);
    status.textContent = markerScope === 'building' ? copy.readyBuildings(models.length, latestBuildingTotal) : copy.ready(models.length);
    trackView(models);
  }

  function publishViewport() {
    if (!map || !window.KHGMapViewport || typeof map.getBounds !== 'function') return;
    const bounds = currentMapBounds();
    if (!bounds) return;
    const visible = KHGMapViewport.filterModelsByBounds(latestModels, bounds);
    const complete = KHGMapViewport.hasCompleteViewportCoverage({
      markerScope,
      locatedCount:markerScope === 'building' ? latestBuildingAttemptedCount : latestModels.length,
      totalCount:markerScope === 'building' ? latestBuildingTotal : latestModels.length
    });
    if (searchAreaButton) searchAreaButton.hidden = markerScope !== 'building';
    window.dispatchEvent(new CustomEvent('khg:map-viewport-change', { detail:{
      markerScope,
      bounds,
      zoom:typeof map.getZoom === 'function' ? Number(map.getZoom()) : null,
      complete,
      visibleDongs:visible.filter(model => model.kind === 'neighborhood').map(model => model.dong),
      visibleBuildingKeys:visible.filter(model => model.kind === 'building').map(model => model.buildingKey)
    } }));
  }

  function currentMapBounds() {
    if (!map || typeof map.getBounds !== 'function') return null;
    const mapBounds = map.getBounds();
    return mapBounds && typeof mapBounds.toJSON === 'function' ? mapBounds.toJSON() : null;
  }

  function distanceKm(a, b) {
    const radians = value => Number(value) * Math.PI / 180;
    const dLat = radians(b.lat - a.lat);
    const dLng = radians(b.lng - a.lng);
    const lat1 = radians(a.lat);
    const lat2 = radians(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function buildingGeocodeQueries(item) {
    const district = KHGMapLocations && KHGMapLocations.districtKorean
      ? KHGMapLocations.districtKorean(latest.lawdCd)
      : '';
    return KHGMapController.buildingGeocodeQueries(item, district);
  }

  async function ensureGeocoder() {
    if (geocoder) return geocoder;
    if (google.maps.importLibrary) {
      const library = await google.maps.importLibrary('geocoding');
      geocoder = new library.Geocoder();
    } else geocoder = new google.maps.Geocoder();
    return geocoder;
  }

  async function verifiedBuildingPoint(item) {
    const queries = buildingGeocodeQueries(item);
    for (const query of queries) {
      if (geocodeCache.has(query)) {
        const cached = geocodeCache.get(query);
        if (cached) return cached;
        continue;
      }
      const stored = window.KHGMapViewport && KHGMapViewport.readPoint(browserPointStorage(), query);
      if (stored) {
        geocodeCache.set(query, stored);
        return stored;
      }
      try {
        const service = await ensureGeocoder();
        const response = await service.geocode({ address:query, region:'KR' });
        const result = response && response.results && response.results[0];
        const type = result && result.geometry && result.geometry.location_type;
        const location = result && result.geometry && result.geometry.location;
        const point = location ? { lat:location.lat(), lng:location.lng() } : null;
        const center = KHGMapLocations.centerFor(latest.lawdCd, item.dong);
        const precise = ['ROOFTOP','GEOMETRIC_CENTER'].includes(String(type || ''));
        const verified = point && center && precise && !result.partial_match && distanceKm(center, point) <= 4;
        const value = verified ? point : null;
        geocodeCache.set(query, value);
        if (value && window.KHGMapViewport) KHGMapViewport.writePoint(browserPointStorage(), query, value);
        if (value) return value;
      } catch (_) {
        geocodeCache.set(query, null);
      }
    }
    return null;
  }

  async function showBuildingLayer(detail = {}, {
    reset = true,
    fitViewport = true,
    requestedBounds = null
  } = {}) {
    const requestId = ++buildingLayerRequestId;
    latestBuildingDetail = detail;
    const candidates = (Array.isArray(detail.buildings) ? detail.buildings : []).filter(item => item && item.mapLocation);
    latestBuildingTotal = candidates.length;
    if (reset) {
      latestBuildingAttemptedCount = 0;
      latestBuildings = [];
      knownBuildingPoints.clear();
      attemptedBuildingKeys.clear();
    }
    if (!candidates.length) { status.textContent = copy.noBuildings; return; }
    status.textContent = copy.locating;
    const knownBefore = candidates.map(item => knownBuildingPoints.get(String(item.buildingKey || ''))).filter(Boolean);
    const visibleKnown = window.KHGMapViewport
      ? KHGMapViewport.selectModelsForViewport(knownBefore, requestedBounds, MAX_BUILDING_MARKERS)
      : knownBefore.slice(0, MAX_BUILDING_MARKERS);
    const remainingQuota = Math.max(0, MAX_BUILDING_GEOCODE_ATTEMPTS - attemptedBuildingKeys.size);
    const needed = Math.max(0, MAX_BUILDING_MARKERS - visibleKnown.length);
    const unattempted = candidates.filter(item => !attemptedBuildingKeys.has(String(item.buildingKey || '')));
    const located = needed && remainingQuota ? await KHGMapController.locateBuildingCandidates(unattempted, async item => {
      const key = String(item.buildingKey || '');
      attemptedBuildingKeys.add(key);
      const point = await verifiedBuildingPoint(item);
      if (point) knownBuildingPoints.set(key, { ...item, ...point });
      return point && requestedBounds && window.KHGMapViewport
        ? (KHGMapViewport.pointWithinBounds(point, requestedBounds) ? point : null)
        : point;
    }, { targetCount:needed, candidateLimit:Math.min(96, remainingQuota) }) : [];
    if (requestId !== buildingLayerRequestId) return;
    latestBuildingAttemptedCount = attemptedBuildingKeys.size;
    const known = candidates.map(item => knownBuildingPoints.get(String(item.buildingKey || ''))).filter(Boolean);
    latestBuildings = window.KHGMapViewport
      ? KHGMapViewport.selectModelsForViewport(known, requestedBounds, MAX_BUILDING_MARKERS)
      : known.slice(0, MAX_BUILDING_MARKERS);
    if (!latestBuildings.length && reset) { status.textContent = copy.noBuildings; return; }
    markerScope = 'building';
    selectedMarkerId = '';
    viewTracked = false;
    if (backButton) backButton.hidden = false;
    renderMarkers({ fitViewport });
    if (!latestBuildings.length) status.textContent = copy.noAreaBuildings;
    if (!fitViewport) publishViewport();
  }

  function createMap(mapId = '') {
    const center = KHGMapLocations.centerFor(latest.lawdCd, '') || { lat:37.5665, lng:126.9780 };
    const configuredMapId = String(mapId || '').trim();
    const hasMarkerLibrary = Boolean(google.maps.marker && google.maps.marker.AdvancedMarkerElement);
    const hasProductionMapId = Boolean(configuredMapId && configuredMapId !== 'DEMO_MAP_ID');
    map = new google.maps.Map(canvas, {
      center,
      zoom:12,
      streetViewControl:false,
      fullscreenControl:false,
      mapTypeControl:false,
      clickableIcons:false,
      gestureHandling:'cooperative',
      ...(hasProductionMapId ? { mapId:configuredMapId } : {})
    });
    if (typeof map.addListener === 'function') map.addListener('idle', publishViewport);
    useAdvancedMarkers = hasMarkerLibrary && KHGMapController.advancedMarkersAvailable(map, configuredMapId);
    if (hasProductionMapId && typeof map.addListener === 'function') {
      map.addListener('mapcapabilities_changed', () => {
        const nextMode = hasMarkerLibrary && KHGMapController.advancedMarkersAvailable(map, configuredMapId);
        if (nextMode === useAdvancedMarkers) return;
        useAdvancedMarkers = nextMode;
        renderMarkers({ fitViewport:false });
      });
    }
    renderMarkers();
  }

  function loadSdk(apiKey) {
    return new Promise((resolve, reject) => {
      if (window.google && google.maps) { resolve(); return; }
      const callback = `__khgMapsReady_${Date.now()}`;
      const script = document.createElement('script');
      const timeout = window.setTimeout(() => { cleanup(); reject(new Error('Maps timeout')); }, 15000);
      function cleanup() { window.clearTimeout(timeout); try { delete window[callback]; } catch (_) { window[callback] = undefined; } }
      window[callback] = () => { cleanup(); resolve(); };
      script.async = true;
      script.defer = true;
      script.src = KHGMapController.buildMapsSdkUrl({ apiKey, callback, locale:latest.locale });
      script.addEventListener('error', () => { cleanup(); reject(new Error('Maps script failed')); }, { once:true });
      document.head.appendChild(script);
    });
  }

  async function start() {
    if (started) return;
    started = true;
    status.textContent = copy.loading;
    try {
      const response = await fetch('/api/maps-config', { headers:{ Accept:'application/json' } });
      const config = await response.json();
      if (!response.ok || !config.enabled || !config.apiKey) { status.textContent = copy.disabled; canvas.classList.add('is-map-fallback'); return; }
      await loadSdk(config.apiKey);
      createMap(config.mapId);
    } catch (_) {
      status.textContent = copy.unavailable;
      canvas.classList.add('is-map-fallback');
    }
  }

  window.addEventListener('khg:explorer-dongs', event => {
    const detail = event.detail || {};
    latest = { ...latest, ...detail };
    buildingLayerRequestId += 1;
    markerScope = 'neighborhood';
    latestBuildings = [];
    latestBuildingTotal = 0;
    latestBuildingAttemptedCount = 0;
    knownBuildingPoints.clear();
    attemptedBuildingKeys.clear();
    latestBuildingDetail = null;
    selectedMarkerId = '';
    if (backButton) backButton.hidden = true;
    if (searchAreaButton) searchAreaButton.hidden = true;
    renderMarkers();
  });
  window.addEventListener('khg:explorer-buildings', event => { void showBuildingLayer(event.detail || {}); });
  async function publishBuildingWindowLocation(selection) {
    if (!selection || selection.kind !== 'building') return;
    const located = latestModels.find(model => model.kind === 'building' && model.buildingKey === selection.buildingKey);
    if (located) {
      window.dispatchEvent(new CustomEvent('khg:building-window-location', { detail:{ model:located } }));
      return;
    }
    if (!map && !started) await start();
    if (!map || !selection.mapLocation) return;
    const point = await verifiedBuildingPoint(selection);
    if (!point) return;
    window.dispatchEvent(new CustomEvent('khg:building-window-location', { detail:{ model:{ ...selection, ...point } } }));
  }

  window.addEventListener('khg:building-window-location-request', event => {
    const selection = event.detail && event.detail.selection;
    void publishBuildingWindowLocation(selection);
  });
  window.addEventListener('khg:map-clear-selection', () => highlight('', false));
  window.addEventListener('khg:analytics-ready', () => trackView(latestModels));

  document.addEventListener('pointerover', event => {
    const card = event.target.closest && event.target.closest('.neighborhood-card[data-dong]');
    if (card && markerScope === 'neighborhood') highlight(card.dataset.dong, true);
  });
  document.addEventListener('focusin', event => {
    const card = event.target.closest && event.target.closest('.neighborhood-card[data-dong]');
    if (card && markerScope === 'neighborhood') highlight(card.dataset.dong, true);
  });

  if (backButton) backButton.addEventListener('click', () => {
    buildingLayerRequestId += 1;
    markerScope = 'neighborhood';
    latestBuildings = [];
    latestBuildingTotal = 0;
    latestBuildingAttemptedCount = 0;
    knownBuildingPoints.clear();
    attemptedBuildingKeys.clear();
    latestBuildingDetail = null;
    selectedMarkerId = '';
    backButton.hidden = true;
    if (searchAreaButton) searchAreaButton.hidden = true;
    viewTracked = false;
    renderMarkers();
    window.dispatchEvent(new CustomEvent('khg:map-back-neighborhoods'));
  });

  if (searchAreaButton) searchAreaButton.addEventListener('click', async () => {
    if (!latestBuildingDetail) return;
    const requestedBounds = currentMapBounds();
    if (!requestedBounds) return;
    searchAreaButton.disabled = true;
    searchAreaButton.textContent = copy.searchingArea;
    await showBuildingLayer(latestBuildingDetail, { reset:false, fitViewport:false, requestedBounds });
    searchAreaButton.disabled = false;
    searchAreaButton.textContent = copy.searchArea;
    publishViewport();
  });

  if (selectionDrag && selectionPanel) {
    selectionDrag.addEventListener('pointerdown', event => {
      if (mobileMapLayout()) { resetSelectionPanelPosition(); return; }
      if (event.button !== 0) return;
      const surface = selectionPanel.parentElement.getBoundingClientRect();
      const panel = selectionPanel.getBoundingClientRect();
      panelDrag = { pointerId:event.pointerId, offsetX:event.clientX - panel.left, offsetY:event.clientY - panel.top, surfaceLeft:surface.left, surfaceTop:surface.top };
      selectionDrag.setPointerCapture(event.pointerId);
      selectionDrag.classList.add('is-dragging');
      event.preventDefault();
    });
    selectionDrag.addEventListener('pointermove', event => {
      if (!panelDrag || event.pointerId !== panelDrag.pointerId) return;
      moveSelectionPanel(event.clientX - panelDrag.surfaceLeft - panelDrag.offsetX, event.clientY - panelDrag.surfaceTop - panelDrag.offsetY);
    });
    const finishPanelDrag = event => {
      if (!panelDrag || event.pointerId !== panelDrag.pointerId) return;
      panelDrag = null;
      selectionDrag.classList.remove('is-dragging');
      if (selectionDrag.hasPointerCapture(event.pointerId)) selectionDrag.releasePointerCapture(event.pointerId);
    };
    selectionDrag.addEventListener('pointerup', finishPanelDrag);
    selectionDrag.addEventListener('pointercancel', finishPanelDrag);
    selectionDrag.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key)) return;
      if (event.key === 'Home') resetSelectionPanelPosition();
      else {
        const step = event.shiftKey ? 40 : 16;
        const panel = selectionPanel.getBoundingClientRect();
        const surface = selectionPanel.parentElement.getBoundingClientRect();
        const left = panel.left - surface.left + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0);
        const top = panel.top - surface.top + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0);
        moveSelectionPanel(left, top);
      }
      event.preventDefault();
    });
    if ('ResizeObserver' in window) new ResizeObserver(keepSelectionPanelInMap).observe(selectionPanel);
    window.addEventListener('resize', keepSelectionPanelInMap);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); start(); }
    }, { rootMargin:'240px' });
    observer.observe(canvas);
  } else start();
})();
