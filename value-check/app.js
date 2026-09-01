(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const EOK = 1e8, MAN = 1e4;

  const DISTRICTS = {
    '11110':'종로구','11140':'중구','11170':'용산구','11200':'성동구','11215':'광진구',
    '11230':'동대문구','11260':'중랑구','11290':'성북구','11305':'강북구','11320':'도봉구',
    '11350':'노원구','11380':'은평구','11410':'서대문구','11440':'마포구','11470':'양천구',
    '11500':'강서구','11530':'구로구','11545':'금천구','11560':'영등포구','11590':'동작구',
    '11620':'관악구','11650':'서초구','11680':'강남구','11710':'송파구','11740':'강동구'
  };

  const state = { gu:'11680', dong:null, building:null, area:76.8, floor:9, asking:null, data:null };

  function formatWon(won) {
    const v = Math.round(Number(won) || 0);
    const eok = Math.floor(v / EOK);
    const man = Math.round((v % EOK) / MAN);
    if (eok && man) return `${eok}억 ${man.toLocaleString('ko-KR')}만`;
    if (eok) return `${eok}억`;
    return `${man.toLocaleString('ko-KR')}만`;
  }

  function parseAmount(raw) {
    if (raw == null) return NaN;
    const s = String(raw).trim().replace(/[,\s]/g, '');
    if (!s) return NaN;
    const m = s.match(/^(?:(\d+(?:\.\d+)?)억)?(?:(\d+(?:\.\d+)?)만)?$/);
    if (m && (m[1] || m[2])) return (parseFloat(m[1]||0)*EOK) + (parseFloat(m[2]||0)*MAN);
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function fill(sel, items, selected) {
    sel.innerHTML = '';
    items.forEach(v => {
      const o = document.createElement('option');
      o.value = v; o.textContent = v;
      if (v === selected) o.selected = true;
      sel.appendChild(o);
    });
  }

  async function loadDistrict() {
    const status = $('vcStatus');
    status.textContent = DISTRICTS[state.gu] + ' 자료를 불러오는 중…';
    try {
      state.data = await SignedValue.loadDistrict(state.gu, '/data/signedvalue/');
      status.textContent = '';
    } catch (e) {
      status.textContent = '이 자치구 자료를 불러오지 못했습니다.';
      state.data = null;
      render();
      return;
    }
    const dongs = Object.keys(state.data.dongs).sort();
    state.dong = dongs.includes(state.dong) ? state.dong : dongs[0];
    fill($('inDong'), dongs, state.dong);
    refreshBuildings();
  }

  function refreshBuildings() {
    const names = Object.keys(state.data.dongs[state.dong]).sort();
    state.building = names.includes(state.building) ? state.building : names[0];
    fill($('inBuilding'), names, state.building);
    // seed size and floor from the complex's own reference unit
    const groups = state.data.dongs[state.dong][state.building];
    const first = groups[Object.keys(groups)[0]];
    if (first) {
      state.area = first[2];
      state.floor = first[3];
      $('inArea').value = state.area;
      $('inFloor').value = state.floor;
    }
    render();
  }

  function render() {
    const est = state.data
      ? SignedValue.estimate(state.data, {
          dong: state.dong, building: state.building,
          areaSqm: state.area, floor: state.floor })
      : null;

    const figure = $('vcFigure'), range = $('vcRange'), meta = $('vcMeta');
    const missing = $('vcMissing'), askBox = $('vcAskBox');

    if (!est) {
      figure.textContent = '—';
      range.textContent = '';
      meta.textContent = '';
      missing.hidden = false;
      askBox.hidden = true;
      return;
    }
    missing.hidden = true;
    askBox.hidden = false;

    figure.textContent = formatWon(est.won);
    range.textContent = `${formatWon(est.low)} ~ ${formatWon(est.high)}`;
    meta.textContent =
      `전용 ${est.band}㎡ 구간 · 신고 매매 ${est.contracts}건 · ${est.asOfMonth.slice(0,4)}년 ${Number(est.asOfMonth.slice(4))}월 기준`;

    const cmp = SignedValue.compareAsking(est, state.asking);
    const verdictBox = $('vcVerdict');
    if (!cmp) {
      verdictBox.hidden = true;
    } else {
      verdictBox.hidden = false;
      verdictBox.className = 'vc-verdict vc-' + cmp.verdict;
      $('vcGap').textContent = (cmp.gapPct >= 0 ? '+' : '−') + Math.abs(cmp.gapPct).toFixed(1) + '%';
      $('vcGapLabel').textContent = cmp.gapPct >= 0 ? '추정가 대비 높음' : '추정가 대비 낮음';
      $('vcMeaning').textContent = cmp.meaning;
    }
  }

  function init() {
    if (!window.SignedValue) {
      $('vcStatus').textContent = '추정 모듈을 불러오지 못했습니다. 새로고침해 주세요.';
      return;
    }
    const acc = SignedValue.ACCURACY;
    $('vcAccuracy').textContent = acc.mdapePct.toFixed(1) + '%';
    $('vcAccuracyBasis').textContent = acc.basis;
    $('vcNoise').textContent = SignedValue.GAP.noisePct + '%';
    $('vcNotable').textContent = SignedValue.GAP.notablePct + '%';

    fill($('inGu'), Object.keys(DISTRICTS).map(k => DISTRICTS[k]), DISTRICTS[state.gu]);
    $('inGu').addEventListener('change', e => {
      const code = Object.keys(DISTRICTS).find(k => DISTRICTS[k] === e.target.value);
      if (code) { state.gu = code; state.dong = null; state.building = null; loadDistrict(); }
    });
    $('inDong').addEventListener('change', e => { state.dong = e.target.value; refreshBuildings(); });
    $('inBuilding').addEventListener('change', e => { state.building = e.target.value; refreshBuildings(); });
    $('inArea').addEventListener('input', e => {
      const v = parseFloat(e.target.value); if (v > 0) { state.area = v; render(); } });
    $('inFloor').addEventListener('input', e => {
      const v = parseFloat(e.target.value); if (Number.isFinite(v)) { state.floor = v; render(); } });
    $('inAsking').addEventListener('input', e => {
      const v = parseAmount(e.target.value);
      state.asking = Number.isFinite(v) && v > 0 ? v : null;
      render();
    });
    loadDistrict();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
