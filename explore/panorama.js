(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.KHGExplorerPanorama = api;
    if (root.document && root.addEventListener) api.install(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const MAX_DISTANCE_METERS = 50;

  function number(value) {
    const result = typeof value === 'function' ? value() : value;
    return Number(result);
  }

  function point(value) {
    if (!value) return null;
    const lat = number(value.lat);
    const lng = number(value.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  function distanceMeters(a, b) {
    const first = point(a);
    const second = point(b);
    if (!first || !second) return Infinity;
    const radians = value => value * Math.PI / 180;
    const dLat = radians(second.lat - first.lat);
    const dLng = radians(second.lng - first.lng);
    const lat1 = radians(first.lat);
    const lat2 = radians(second.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function isNearby(target, capture, maxDistance = MAX_DISTANCE_METERS) {
    return distanceMeters(target, capture) <= Number(maxDistance);
  }

  function evaluateResult({ status, target, location } = {}) {
    const capture = location && location.coord;
    const available = status === 'OK' && isNearby(target, capture);
    return Object.freeze({
      available,
      photoDate:available ? String(location && location.photodate || '') : ''
    });
  }

  function buildSdkUrl(keyId) {
    return `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(String(keyId || '').trim())}&submodules=panorama`;
  }

  function loadSdk(windowObject, keyId) {
    return new Promise((resolve, reject) => {
      if (windowObject.naver && windowObject.naver.maps && windowObject.naver.maps.Panorama) { resolve(); return; }
      const script = windowObject.document.createElement('script');
      const timeout = windowObject.setTimeout(() => reject(new Error('NAVER panorama timeout')), 15000);
      script.async = true;
      script.src = buildSdkUrl(keyId);
      script.addEventListener('load', () => {
        windowObject.clearTimeout(timeout);
        if (windowObject.naver && windowObject.naver.maps && windowObject.naver.maps.Panorama) resolve();
        else reject(new Error('NAVER panorama unavailable'));
      }, { once:true });
      script.addEventListener('error', () => {
        windowObject.clearTimeout(timeout);
        reject(new Error('NAVER panorama failed'));
      }, { once:true });
      windowObject.document.head.appendChild(script);
    });
  }

  function install(windowObject) {
    const documentObject = windowObject.document;
    const section = documentObject.querySelector('#explorerStreetView');
    const canvas = documentObject.querySelector('#explorerStreetViewCanvas');
    const status = documentObject.querySelector('#explorerStreetViewStatus');
    const meta = documentObject.querySelector('#explorerStreetViewMeta');
    const panel = documentObject.querySelector('#explorerMapSelection');
    if (!section || !canvas || !status || !meta) return null;
    const zh = String(documentObject.documentElement.lang || '').toLowerCase().startsWith('zh');
    const copy = zh ? {
      loading:'正在查找建筑附近的街景…',
      unavailable:'该建筑 50 米范围内暂无可用街景。',
      captured:date => date ? `街景拍摄时间：${date}` : '建筑附近街景'
    } : {
      loading:'Finding street view near this building…',
      unavailable:'No street view is available within 50 m of this building.',
      captured:date => date ? `Street view captured ${date}` : 'Street view near this building'
    };
    let requestId = 0;
    let panorama = null;
    let configPromise = null;

    function reset() {
      requestId += 1;
      if (panorama && typeof panorama.setVisible === 'function') panorama.setVisible(false);
      panorama = null;
      canvas.replaceChildren();
      canvas.hidden = true;
      meta.textContent = '';
      status.textContent = '';
      section.hidden = true;
      if (panel) panel.classList.remove('has-street-view');
    }

    function getConfig() {
      if (!configPromise) {
        configPromise = windowObject.fetch('/api/maps-config', { headers:{ Accept:'application/json' } })
          .then(response => response.ok ? response.json() : {})
          .catch(() => ({}));
      }
      return configPromise;
    }

    async function show(model) {
      reset();
      if (!model || model.kind !== 'building' || !point(model)) return;
      const currentRequest = requestId;
      section.hidden = false;
      status.textContent = copy.loading;
      try {
        const config = await getConfig();
        if (currentRequest !== requestId) return;
        if (!config.naverKeyId) { reset(); return; }
        await loadSdk(windowObject, config.naverKeyId);
        if (currentRequest !== requestId) return;
        canvas.hidden = false;
        panorama = new windowObject.naver.maps.Panorama(canvas, {
          position:new windowObject.naver.maps.LatLng(Number(model.lat), Number(model.lng)),
          size:new windowObject.naver.maps.Size(Math.max(canvas.clientWidth || 320, 240), Math.max(canvas.clientHeight || 160, 140)),
          pov:{ pan:0, tilt:0, fov:90 }
        });
        windowObject.naver.maps.Event.addListener(panorama, 'pano_status', panoramaStatus => {
          if (currentRequest !== requestId) return;
          const result = evaluateResult({ status:panoramaStatus, target:model, location:panorama.getLocation() });
          if (!result.available) {
            if (panorama && typeof panorama.setVisible === 'function') panorama.setVisible(false);
            canvas.hidden = true;
            status.textContent = copy.unavailable;
            meta.textContent = '';
            return;
          }
          status.textContent = '';
          meta.textContent = copy.captured(result.photoDate);
          if (panel) panel.classList.add('has-street-view');
        });
      } catch (_) {
        if (currentRequest !== requestId) return;
        canvas.hidden = true;
        status.textContent = copy.unavailable;
        meta.textContent = '';
      }
    }

    windowObject.addEventListener('khg:map-select-building', event => { void show(event.detail && event.detail.model); });
    windowObject.addEventListener('khg:map-select-dong', reset);
    windowObject.addEventListener('khg:map-back-neighborhoods', reset);
    windowObject.addEventListener('khg:map-clear-selection', reset);
    return Object.freeze({ show, reset });
  }

  return Object.freeze({ MAX_DISTANCE_METERS, distanceMeters, isNearby, evaluateResult, buildSdkUrl, install });
});
