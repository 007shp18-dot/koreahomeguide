(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.KHGExplorerPanorama = api;
    if (root.document && root.addEventListener) api.install(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const PANORAMA_MODULE_URL = 'https://oapi.map.naver.com/openapi/v3/maps-panorama.js';

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

  function evaluateResult({ status, target, location } = {}) {
    const capture = location && location.coord;
    const available = status === 'OK';
    const captureDistance = distanceMeters(target, capture);
    return Object.freeze({
      available,
      photoDate:available ? String(location && location.photodate || '') : '',
      distanceMeters:available && Number.isFinite(captureDistance) ? Math.round(captureDistance) : null
    });
  }

  function buildCoreSdkUrl(keyId) {
    return `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(String(keyId || '').trim())}&submodules=geocoder`;
  }

  function legalCodeFromResponse(response, model = {}) {
    const results = response && response.v2 && Array.isArray(response.v2.results) ? response.v2.results : [];
    const legal = results.find(result => result && result.name === 'legalcode');
    const code = String(legal && legal.code && legal.code.id || '').trim();
    const districtCode = String(model.districtCode || '').trim();
    const dong = String(model.dong || '').normalize('NFKC').trim();
    const resultDong = String(legal && legal.region && legal.region.area3 && legal.region.area3.name || '').normalize('NFKC').trim();
    if (!/^\d{10}$/.test(code) || !/^\d{5}$/.test(districtCode)) return '';
    if (code.slice(0, 5) !== districtCode || !dong || resultDong !== dong) return '';
    return code;
  }

  function reverseLegalCode(windowObject, model) {
    return new Promise(resolve => {
      const maps = windowObject && windowObject.naver && windowObject.naver.maps;
      if (!maps || !maps.Service || typeof maps.Service.reverseGeocode !== 'function') { resolve(''); return; }
      const target = point(model);
      if (!target) { resolve(''); return; }
      try {
        maps.Service.reverseGeocode({
          coords:new maps.LatLng(target.lat, target.lng),
          orders:'legalcode'
        }, (status, response) => {
          if (status !== maps.Service.Status.OK) { resolve(''); return; }
          resolve(legalCodeFromResponse(response, model));
        });
      } catch (_) {
        resolve('');
      }
    });
  }

  function loadScript(windowObject, src, message) {
    return new Promise((resolve, reject) => {
      const script = windowObject.document.createElement('script');
      const timeout = windowObject.setTimeout(() => reject(new Error(`${message} timeout`)), 15000);
      script.async = true;
      script.src = src;
      script.addEventListener('load', () => {
        windowObject.clearTimeout(timeout);
        resolve();
      }, { once:true });
      script.addEventListener('error', () => {
        windowObject.clearTimeout(timeout);
        reject(new Error(`${message} failed`));
      }, { once:true });
      windowObject.document.head.appendChild(script);
    });
  }

  async function loadSdk(windowObject, keyId) {
    if (windowObject.naver && windowObject.naver.maps && windowObject.naver.maps.Panorama) return;
    if (!(windowObject.naver && windowObject.naver.maps)) {
      await loadScript(windowObject, buildCoreSdkUrl(keyId), 'NAVER maps core');
    }
    if (!(windowObject.naver && windowObject.naver.maps)) throw new Error('NAVER maps core unavailable');
    if (!windowObject.naver.maps.Panorama) {
      await loadScript(windowObject, PANORAMA_MODULE_URL, 'NAVER panorama module');
    }
    if (!windowObject.naver.maps.Panorama) throw new Error('NAVER panorama module unavailable');
  }

  function statusCopy(zh) {
    return zh ? {
      loading:'正在查找建筑附近的街景…',
      unavailable:'该建筑附近暂无可用街景。',
      error:'街景暂时无法加载，请稍后再试。',
      captured:(date, distance) => {
        const label = date ? `街景拍摄时间：${date}` : '建筑附近街景';
        return Number.isFinite(distance) ? `${label} · 距地图中的建筑 ${distance} 米` : label;
      }
    } : {
      loading:'Finding street view near this building…',
      unavailable:'No nearby street view is available for this building.',
      error:'Street view could not be loaded. Please try again later.',
      captured:(date, distance) => {
        const label = date ? `Street view captured ${date}` : 'Nearby street view';
        return Number.isFinite(distance) ? `${label} · ${distance} m from mapped building` : label;
      }
    };
  }

  function install(windowObject) {
    const documentObject = windowObject.document;
    const section = documentObject.querySelector('#explorerStreetView');
    const canvas = documentObject.querySelector('#explorerStreetViewCanvas');
    const status = documentObject.querySelector('#explorerStreetViewStatus');
    const meta = documentObject.querySelector('#explorerStreetViewMeta');
    const panel = documentObject.querySelector('.building-status-window');
    if (!section || !canvas || !status || !meta) return null;
    const zh = String(documentObject.documentElement.lang || '').toLowerCase().startsWith('zh');
    const copy = statusCopy(zh);
    const analytics = windowObject.KHGProductAnalytics
      ? windowObject.KHGProductAnalytics.createTracker(windowObject)
      : null;
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
      section.dataset.state = 'idle';
      section.hidden = true;
      if (panel) panel.classList.remove('has-street-view');
    }

    function prepare() {
      reset();
      section.hidden = false;
      section.dataset.state = 'loading';
      status.textContent = copy.loading;
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
      prepare();
      if (!model || model.kind !== 'building' || !point(model)) return;
      const currentRequest = requestId;
      let outcomeTracked = false;
      const trackOutcome = (resultState, errorCategory = '') => {
        if (outcomeTracked || !analytics) return false;
        outcomeTracked = true;
        return analytics.emit('explorer_street_view_result', {
          language:zh ? 'zh-CN' : 'en', districtCode:model.districtCode,
          propertyType:model.propertyType, resultState, errorCategory
        });
      };
      try {
        const config = await getConfig();
        if (currentRequest !== requestId) return;
        if (!config.naverKeyId) { trackOutcome('unconfigured', 'config'); reset(); return; }
        await loadSdk(windowObject, config.naverKeyId);
        if (currentRequest !== requestId) return;
        void reverseLegalCode(windowObject, model).then(legalCode => {
          if (!legalCode || currentRequest !== requestId) return;
          windowObject.dispatchEvent(new CustomEvent('khg:building-window-legal-code', { detail:{ model, legalCode } }));
        });
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
            section.dataset.state = 'empty';
            status.textContent = copy.unavailable;
            meta.textContent = '';
            trackOutcome('empty');
            return;
          }
          status.textContent = '';
          section.dataset.state = 'ready';
          meta.textContent = copy.captured(result.photoDate, result.distanceMeters);
          if (panel) panel.classList.add('has-street-view');
          trackOutcome('ready');
        });
      } catch (_) {
        if (currentRequest !== requestId) return;
        canvas.hidden = true;
        section.dataset.state = 'error';
        status.textContent = copy.error;
        meta.textContent = '';
        trackOutcome('error', 'sdk');
      }
    }

    windowObject.addEventListener('khg:map-select-building', event => { void show(event.detail && event.detail.model); });
    windowObject.addEventListener('khg:building-window-location', event => { void show(event.detail && event.detail.model); });
    windowObject.addEventListener('khg:building-window-reset', prepare);
    windowObject.addEventListener('khg:building-window-close', reset);
    windowObject.addEventListener('khg:map-select-dong', reset);
    windowObject.addEventListener('khg:map-back-neighborhoods', reset);
    windowObject.addEventListener('khg:map-clear-selection', reset);
    return Object.freeze({ show, reset, prepare });
  }

  return Object.freeze({ PANORAMA_MODULE_URL, distanceMeters, evaluateResult, buildCoreSdkUrl, legalCodeFromResponse, reverseLegalCode, loadSdk, statusCopy, install });
});
