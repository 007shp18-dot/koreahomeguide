(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const EOK = 1e8, MAN = 1e4;

  const state = {
    priceWon: 12 * EOK, purchaseWon: 8 * EOK, loanWon: 4 * EOK,
    tenantDepositWon: 0, brokerageWon: null, capitalGainsTaxWon: null,
    legalWon: 300000, singleHomeExempt: true
  };

  function formatWon(won) {
    const v = Math.round(Number(won) || 0);
    const neg = v < 0, a = Math.abs(v);
    const eok = Math.floor(a / EOK), man = Math.round((a % EOK) / MAN);
    let s;
    if (eok && man) s = `${eok}억 ${man.toLocaleString('ko-KR')}만`;
    else if (eok) s = `${eok}억`;
    else s = `${man.toLocaleString('ko-KR')}만`;
    return (neg ? '−' : '') + s + '원';
  }
  function parseAmount(raw) {
    if (raw == null) return NaN;
    const s = String(raw).trim().replace(/[,\s원]/g, '');
    if (!s) return NaN;
    const m = s.match(/^(?:(\d+(?:\.\d+)?)억)?(?:(\d+(?:\.\d+)?)만)?$/);
    if (m && (m[1] || m[2])) return (parseFloat(m[1]||0)*EOK) + (parseFloat(m[2]||0)*MAN);
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function row(label, value, opts) {
    const d = document.createElement('div');
    d.className = 'np-row' + (opts && opts.cls ? ' ' + opts.cls : '');
    const l = document.createElement('span'); l.textContent = label;
    if (opts && opts.note) {
      const s = document.createElement('small'); s.textContent = opts.note; l.appendChild(s);
    }
    const v = document.createElement('span'); v.textContent = value;
    d.appendChild(l); d.appendChild(v);
    return d;
  }

  function render() {
    const r = NetProceeds.compute(state);
    const body = $('npRows');
    body.innerHTML = '';
    body.appendChild(row('매도가', formatWon(r.price), { cls: 'np-plus' }));
    body.appendChild(row('대출잔액 상환', '− ' + formatWon(r.loan)));
    if (r.deposit > 0) body.appendChild(row('임차보증금 반환', '− ' + formatWon(r.deposit)));
    body.appendChild(row('중개보수', '− ' + formatWon(r.brokerage),
      { note: r.brokerageIsCap ? '법정 상한요율 기준 · 협의로 낮출 수 있습니다' : '직접 입력' }));
    body.appendChild(row('양도소득세 등', '− ' + formatWon(r.tax),
      { note: r.taxIsDefault ? '기본값 — 본인 상황으로 반드시 바꾸세요' : '직접 입력', cls: 'np-uncertain' }));
    body.appendChild(row('법무비·등기비', '− ' + formatWon(r.legal)));

    $('npNet').textContent = formatWon(r.net);
    $('npNet').className = 'np-figure' + (r.net < 0 ? ' np-negative' : '');

    const gainBox = $('npGainBox');
    gainBox.hidden = false;
    const pct = Math.round(100 * (r.keptShareOfPrice || 0));
    $('npKeptPct').textContent = pct + '%';
    $('npPrice').textContent = formatWon(r.price);
    $('npKept').textContent = formatWon(r.net);
    $('npBar').style.width = Math.max(0, Math.min(100, pct)) + '%';
    $('npGainLine').textContent = r.netBelowGain
      ? `집값은 ${formatWon(r.gain)} 올랐는데, 손에 쥐는 현금은 ${formatWon(r.net)}입니다. 이미 나간 돈이 상승분보다 큽니다.`
      : r.net < 0
        ? '이 조건에서는 매도가로 갚아야 할 돈을 다 갚지 못합니다.'
        : `매도가 ${formatWon(r.price)} 가운데 ${formatWon(r.net)}이 손에 남습니다. 나머지는 대출·보증금·세금·수수료로 나갑니다.`;

    if (state.brokerageWon == null) {
      const cap = NetProceeds.brokerageCap(state.priceWon);
      $('npBrokerHint').textContent =
        `현재 구간 상한요율 ${(cap.rate*100).toFixed(1)}%` + (cap.capped ? ' (한도액 적용)' : '');
    } else $('npBrokerHint').textContent = '';
  }

  function bindAmount(id, key, allowNull) {
    const el = $(id); if (!el) return;
    el.addEventListener('input', () => {
      const raw = el.value.trim();
      if (allowNull && raw === '') { state[key] = null; render(); return; }
      const v = parseAmount(raw);
      if (Number.isFinite(v) && v >= 0) { state[key] = v; render(); }
    });
  }

  function init() {
    if (!window.NetProceeds) { $('npStatus').textContent = '계산 모듈을 불러오지 못했습니다.'; return; }
    bindAmount('inPrice','priceWon');
    bindAmount('inPurchase','purchaseWon');
    bindAmount('inLoan','loanWon');
    bindAmount('inDeposit','tenantDepositWon');
    bindAmount('inBrokerage','brokerageWon', true);
    bindAmount('inTax','capitalGainsTaxWon', true);
    bindAmount('inLegal','legalWon');
    const ex = $('inExempt');
    if (ex) ex.addEventListener('change', () => { state.singleHomeExempt = ex.checked; render(); });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
