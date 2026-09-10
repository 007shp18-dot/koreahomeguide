// Buy or rent — the same home, the same cash, one monthly figure each.
//
// Nothing here is a recommendation. Every assumption is an input on the page,
// and the output says what the market would have to do, not what it will do.

(function () {
  'use strict';

  const EOK = 100000000;      // 1억
  const MAN = 10000;          // 1만

  const $ = (id) => document.getElementById(id);

  // ---------------------------------------------------------------- formatting

  // 137,000,000 → "1억 3,700만". Won-level detail is noise at this scale.
  function formatWon(won) {
    const v = Math.round(Number(won) || 0);
    const neg = v < 0;
    const a = Math.abs(v);
    const eok = Math.floor(a / EOK);
    const man = Math.round((a % EOK) / MAN);
    let out;
    if (eok && man) out = `${eok}억 ${man.toLocaleString('ko-KR')}만`;
    else if (eok) out = `${eok}억`;
    else out = `${man.toLocaleString('ko-KR')}만`;
    return (neg ? '−' : '') + out;
  }

  function formatManwon(won) {
    const man = Math.round((Number(won) || 0) / MAN);
    return `${man.toLocaleString('ko-KR')}만`;
  }

  function formatPct(x, digits = 2) {
    return `${(Number(x) * 100).toFixed(digits)}%`;
  }

  // Accepts "7.5억", "75000만", "750000000", "7억 5000만".
  function parseAmount(raw) {
    if (raw == null) return NaN;
    const s = String(raw).trim().replace(/[,\s]/g, '');
    if (!s) return NaN;
    const m = s.match(/^(?:(\d+(?:\.\d+)?)억)?(?:(\d+(?:\.\d+)?)만)?$/);
    if (m && (m[1] || m[2])) {
      return (parseFloat(m[1] || 0) * EOK) + (parseFloat(m[2] || 0) * MAN);
    }
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
  }

  // ---------------------------------------------------------------- the maths

  // Level payment on an amortising loan. A zero rate degenerates to principal
  // divided by term, which the closed form cannot express.
  function monthlyPayment(principal, annualRate, years) {
    const n = Math.round(years * 12);
    if (!(n > 0) || !(principal > 0)) return 0;
    const r = annualRate / 12;
    if (r === 0) return principal / n;
    return principal * r / (1 - Math.pow(1 + r, -n));
  }

  // Average principal repaid per month across the FIRST year.
  //
  // Principal repayment is saving, not spending, so it is credited back out of
  // the cost of owning. Year one is the least favourable year — the share of
  // principal only rises after it — so this understates the credit rather than
  // flattering the buy side.
  function firstYearPrincipalPerMonth(principal, annualRate, years) {
    const pay = monthlyPayment(principal, annualRate, years);
    const r = annualRate / 12;
    let bal = principal;
    let repaid = 0;
    const months = Math.min(12, Math.round(years * 12));
    for (let i = 0; i < months; i += 1) {
      const interest = bal * r;
      const principalPart = Math.min(pay - interest, bal);
      repaid += principalPart;
      bal -= principalPart;
      if (bal <= 0) break;
    }
    return months ? repaid / months : 0;
  }

  // Default 취득세 for a single home, as a starting point only.
  //
  // The real rate turns on how many homes the buyer owns, the region, and the
  // floor area, and the bands move. This is an editable input on the page for
  // exactly that reason — the page must not pretend to know the buyer's case.
  function defaultAcquisitionTax(priceWon) {
    const eok = priceWon / EOK;
    let rate;
    if (eok <= 6) rate = 0.01;
    else if (eok <= 9) rate = Math.min(0.03, Math.max(0.01, ((eok * 2 / 3) - 3) / 100));
    else rate = 0.03;
    const local = rate / 10; // 지방교육세, roughly
    return priceWon * (rate + local);
  }

  // ---------------------------------------------------------------- state

  const state = {
    cash: 5000 * MAN,
    price: 7.5 * EOK,
    rentDeposit: 5000 * MAN,
    rentMonthly: 114 * MAN,
    assetType: 'apartment',
    mortgageRate: 0.040,
    termYears: 30,
    holdingRate: 0.0015,
    acqTax: null,          // null → use the default for the current price
    holdYears: 7
  };

  function acquisitionTax() {
    return state.acqTax == null ? defaultAcquisitionTax(state.price) : state.acqTax;
  }

  function compute() {
    const conv = window.SignedConversion;

    // Rent side — restate the contract at the user's cash.
    const rent = conv.signedRent(
      state.rentMonthly, state.rentDeposit, state.cash, state.assetType
    );
    const rentMonthly = rent.monthlyWon;

    // Buy side.
    const loan = Math.max(0, state.price - state.cash);
    const payment = monthlyPayment(loan, state.mortgageRate, state.termYears);
    const principalCredit = firstYearPrincipalPerMonth(loan, state.mortgageRate, state.termYears);
    const holding = state.price * state.holdingRate / 12;
    const acqMonthly = state.holdYears > 0 ? acquisitionTax() / (state.holdYears * 12) : 0;

    const grossOutflow = payment + holding + acqMonthly;
    const ownMonthly = grossOutflow - principalCredit;

    const gap = ownMonthly - rentMonthly;
    const breakEven = state.price > 0 ? (gap * 12) / state.price : 0;

    return {
      rentMonthly, conversionRate: rent.rate,
      loan, payment, principalCredit, holding, acqMonthly,
      grossOutflow, ownMonthly, gap, breakEven
    };
  }

  // ---------------------------------------------------------------- rendering

  function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function render() {
    const r = compute();

    // The rent side goes negative when the user's cash exceeds the contract
    // deposit by enough. Showing a negative rent would be nonsense, so the
    // page says what happened instead of printing the number.
    const rentImpossible = r.rentMonthly < 0;

    setText('rentFigure', rentImpossible ? '—' : formatManwon(Math.max(0, r.rentMonthly)));
    // The rate is the one implied at the CONTRACT deposit, not at the user's
    // cash — say so, or the label reads as the rate for the wrong deposit.
    setText('rentBasis',
      `보증금 ${formatWon(state.cash)} 기준으로 환산 · `
      + `전환율 ${formatPct(r.conversionRate)} (계약 보증금 ${formatWon(state.rentDeposit)} 기준)`);
    const warn = $('rentWarning');
    if (warn) {
      warn.hidden = !rentImpossible;
      warn.textContent = rentImpossible
        ? '입력한 현금이 그 계약의 보증금보다 커서, 같은 조건으로는 환산이 안 됩니다. 보증금이 더 큰 계약과 비교하세요.'
        : '';
    }

    setText('ownFigure', formatManwon(r.ownMonthly));
    setText('ownBasis', `같은 현금 ${formatWon(state.cash)}를 계약금으로 넣었을 때`);

    setText('rowLoan', `대출 ${formatWon(r.loan)} · ${formatPct(state.mortgageRate, 1)} · ${state.termYears}년`);
    setText('valLoan', formatManwon(r.payment));
    setText('rowHolding', `보유비용 · 연 ${formatPct(state.holdingRate, 2)}`);
    setText('valHolding', formatManwon(r.holding));
    setText('rowAcq', `취득세 등 ${formatWon(acquisitionTax())} ÷ ${state.holdYears}년`);
    setText('valAcq', formatManwon(r.acqMonthly));
    setText('valPrincipal', `−${formatManwon(r.principalCredit)}`);

    // Verdict.
    const cheaper = r.gap > 0 ? '빌리는' : '사는';
    setText('verdictLine', rentImpossible
      ? '비교할 임대 계약을 다시 입력해 주세요.'
      : `${cheaper} 쪽이 매달 ${formatManwon(Math.abs(r.gap))}원 쌉니다.`);

    setText('statGap', rentImpossible ? '—' : `${formatManwon(Math.abs(r.gap))}원`);
    setText('statGapLabel', r.gap > 0 ? '사는 쪽이 더 드는 월 차액' : '빌리는 쪽이 더 드는 월 차액');
    setText('statBreakEven', rentImpossible ? '—' : `${(r.breakEven * 100).toFixed(1)}% / 년`);
    setText('statOutflow', `${formatManwon(r.grossOutflow)}원`);

    setText('breakEvenSentence', rentImpossible
      ? ''
      : r.breakEven > 0
        ? `집값이 매년 ${(r.breakEven * 100).toFixed(1)}% 이상 올라야 사는 쪽이 본전입니다. 그 아래면 빌리는 쪽이, 그 위면 사는 쪽이 쌉니다.`
        : `이 조건에서는 집값이 오르지 않아도 사는 쪽이 이미 쌉니다. 값이 떨어지지 않는다는 가정에서요.`);

    renderSensitivity(r);
  }

  // How the break-even moves with the mortgage rate — the input the buyer
  // controls least and that moves the answer most.
  function renderSensitivity(current) {
    const host = $('sensitivityRows');
    if (!host) return;
    const rates = [0.025, 0.030, 0.035, 0.040, 0.045, 0.050];
    const rows = rates.map((rate) => {
      const loan = Math.max(0, state.price - state.cash);
      const payment = monthlyPayment(loan, rate, state.termYears);
      const credit = firstYearPrincipalPerMonth(loan, rate, state.termYears);
      const holding = state.price * state.holdingRate / 12;
      const acq = state.holdYears > 0 ? acquisitionTax() / (state.holdYears * 12) : 0;
      const own = payment + holding + acq - credit;
      const be = state.price > 0 ? ((own - current.rentMonthly) * 12) / state.price : 0;
      return { rate, be };
    });

    const max = Math.max(...rows.map((x) => Math.abs(x.be)), 0.001);
    host.innerHTML = '';
    rows.forEach((row) => {
      const isCurrent = Math.abs(row.rate - state.mortgageRate) < 1e-9;
      const el = document.createElement('div');
      el.className = 'bor-sens-row' + (isCurrent ? ' is-current' : '');
      const width = Math.min(100, (Math.abs(row.be) / max) * 100);
      el.innerHTML = `
        <span class="bor-sens-rate">${(row.rate * 100).toFixed(1)}%</span>
        <span class="bor-sens-track"><span class="bor-sens-fill" style="width:${width.toFixed(1)}%"></span></span>
        <span class="bor-sens-val">${(row.be * 100).toFixed(1)}%</span>`;
      host.appendChild(el);
    });
  }

  // ---------------------------------------------------------------- wiring

  function bindAmount(id, key, opts) {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const v = parseAmount(el.value);
      if (Number.isFinite(v) && v >= 0) {
        state[key] = v;
        if (opts && opts.resetAcqTax) state.acqTax = null;
        render();
      }
    });
  }

  function bindNumber(id, key, scale) {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      if (Number.isFinite(v)) {
        state[key] = scale ? v * scale : v;
        render();
      }
    });
  }

  function init() {
    if (!window.SignedConversion) {
      const s = $('borStatus');
      if (s) s.textContent = '환산 모듈을 불러오지 못했습니다. 페이지를 새로고침해 주세요.';
      return;
    }

    bindAmount('inCash', 'cash');
    bindAmount('inPrice', 'price', { resetAcqTax: true });
    bindAmount('inRentDeposit', 'rentDeposit');
    bindAmount('inRentMonthly', 'rentMonthly');
    bindAmount('inAcqTax', 'acqTax');

    bindNumber('inRate', 'mortgageRate', 0.01);
    bindNumber('inTerm', 'termYears');
    bindNumber('inHolding', 'holdingRate', 0.01);
    bindNumber('inHoldYears', 'holdYears');

    const type = $('inAssetType');
    if (type) {
      type.addEventListener('change', () => {
        state.assetType = type.value;
        render();
      });
    }

    const cashSlider = $('inCashSlider');
    if (cashSlider) {
      cashSlider.addEventListener('input', () => {
        state.cash = Number(cashSlider.value) * MAN;
        const box = $('inCash');
        if (box) box.value = formatWon(state.cash);
        render();
      });
    }

    // Seed the acquisition-tax box with the default so the number on screen and
    // the number in the box never disagree.
    const acqBox = $('inAcqTax');
    if (acqBox && !acqBox.value) acqBox.value = formatWon(defaultAcquisitionTax(state.price));

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
