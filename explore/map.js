(function() {
  'use strict';
  const canvas = document.querySelector('#explorerMap');
  const status = document.querySelector('#explorerMapStatus');
  if (!canvas || !status) return;

  const zh = String(document.documentElement.lang || '').toLowerCase().startsWith('zh');
  const copy = zh ? {
    loading:'正在加载地图…', disabled:'地图暂时不可用；街区卡片仍可正常使用。',
    unavailable:'地图暂时不可用；请使用下方街区卡片。', ready:n => `地图显示 ${n} 个街区中心点。`, empty:'当前条件下没有可显示的街区中心点。',
    strong:'较强依据', limited:'有限依据', outside:'超出预算'
  } : {
    loading:'Loading map…', disabled:'Map temporarily unavailable. Neighborhood cards still work.',
    unavailable:'Map temporarily unavailable. Use the neighborhood cards below.', ready:n => `Showing ${n} neighborhood centers.`, empty:'No mapped neighborhood centers match this selection.',
    strong:'Strong evidence', limited:'Limited evidence', outside:'Outside budget'
  };

  let map = null;
  let markers = [];
  let latest = { lawdCd:'11680', locale:zh ? 'zh-CN' : 'en', dongs:[] };
  let started = false;
  let selectedDong = '';
  let latestModels = [];
  let viewTracked = false;
  let useAdvancedMarkers = false;

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

  function applyAdvancedPinVisual(pin, model, selected) {
    const { glyphFontSize, ...visual } = KHGMapController.advancedPinVisual(model, selected);
    Object.assign(pin, visual);
    pin.style.fontSize = glyphFontSize;
  }

  function updateMarkerVisual(entry, selected) {
    if (entry.advanced) {
      applyAdvancedPinVisual(entry.pin, entry.model, selected);
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

  function highlight(dong, pan) {
    selectedDong = String(dong || '');
    markers.forEach(entry => {
      const selected = entry.model.dong === selectedDong;
      updateMarkerVisual(entry, selected);
    });
    const entry = markers.find(item => item.model.dong === selectedDong);
    if (entry && pan && map) map.panTo({ lat:entry.model.lat, lng:entry.model.lng });
  }

  function renderMarkers() {
    if (!map || !window.KHGMapController) return;
    clearMarkers();
    const models = KHGMapController.buildMarkerModels(latest);
    latestModels = models;
    const districtCenter = KHGMapLocations.centerFor(latest.lawdCd, '');
    if (!models.length) {
      if (districtCenter) { map.setCenter(districtCenter); map.setZoom(12); }
      status.textContent = copy.empty;
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    markers = models.map(model => {
      const position = { lat:model.lat, lng:model.lng };
      const title = `${model.label} · ${copy[model.tone]} · ${model.contractCount}`;
      let marker;
      let pin = null;
      if (useAdvancedMarkers) {
        const { glyphFontSize, ...pinOptions } = KHGMapController.advancedPinVisual(model, false);
        pin = new google.maps.marker.PinElement(pinOptions);
        pin.style.fontSize = glyphFontSize;
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
        highlight(model.dong, false);
        safeTrack('explorer_map_select', analyticsContext(models, model));
        window.dispatchEvent(new CustomEvent('khg:map-select-dong', { detail:{ dong:model.dong, model } }));
      };
      if (useAdvancedMarkers) marker.addEventListener('gmp-click', selectMarker);
      else marker.addListener('click', selectMarker);
      return { model, marker, pin, advanced:useAdvancedMarkers };
    });
    if (models.length === 1) { map.setCenter({ lat:models[0].lat, lng:models[0].lng }); map.setZoom(14); }
    else map.fitBounds(bounds, 34);
    highlight(selectedDong, false);
    status.textContent = copy.ready(models.length);
    trackView(models);
  }

  function createMap(mapId = '') {
    const center = KHGMapLocations.centerFor(latest.lawdCd, '') || { lat:37.5665, lng:126.9780 };
    const configuredMapId = String(mapId || '').trim();
    const hasMarkerLibrary = Boolean(google.maps.marker && google.maps.marker.AdvancedMarkerElement && google.maps.marker.PinElement);
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
    useAdvancedMarkers = hasMarkerLibrary && KHGMapController.advancedMarkersAvailable(map, configuredMapId);
    if (hasProductionMapId && typeof map.addListener === 'function') {
      map.addListener('mapcapabilities_changed', () => {
        const nextMode = hasMarkerLibrary && KHGMapController.advancedMarkersAvailable(map, configuredMapId);
        if (nextMode === useAdvancedMarkers) return;
        useAdvancedMarkers = nextMode;
        renderMarkers();
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
      script.src = KHGMapController.buildMapsSdkUrl({ apiKey, callback });
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
    latest = { ...latest, ...(event.detail || {}) };
    renderMarkers();
  });
  window.addEventListener('khg:map-clear-selection', () => highlight('', false));
  window.addEventListener('khg:analytics-ready', () => trackView(latestModels));

  document.addEventListener('pointerover', event => {
    const card = event.target.closest && event.target.closest('.neighborhood-card[data-dong]');
    if (card) highlight(card.dataset.dong, true);
  });
  document.addEventListener('focusin', event => {
    const card = event.target.closest && event.target.closest('.neighborhood-card[data-dong]');
    if (card) highlight(card.dataset.dong, true);
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); start(); }
    }, { rootMargin:'240px' });
    observer.observe(canvas);
  } else start();
})();
