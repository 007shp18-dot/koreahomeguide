// Salary → Seoul housing.
//
// The point of this tool is one number nobody shows: what the deposit gap costs
// per month. Korean leases trade deposit against rent, so a neighborhood's
// advertised rent is only true at that neighborhood's usual deposit, and a low
// rent bought with a large deposit can be the expensive option.
//
// Note what a person's own cash does and does not do. It shifts every
// neighborhood by the same amount — (deposit − cash) × rate ÷ 12 — so it moves
// the whole list up or down and never reorders it. What it changes is which
// neighborhoods fall under the budget, and by how much the deposit gap costs.
// The tool must not imply a ranking personal to the reader; the reordering it
// shows is advertised rent versus rent restated at one deposit.

(function () {
  'use strict';

  const { DEPOSIT_CONVERSION_REFERENCE, monthlyRentAtDeposit } = window.KHGDepositConversion;
  const RATE = DEPOSIT_CONVERSION_REFERENCE.annualRate;

  // A median of three contracts is noise, not a market. Matches the evidence
  // floor the rent check uses.
  const MIN_CONTRACTS = 5;
  const MAX_ROWS = 30;

  const language = document.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en';
  const locale = language === 'zh-CN' ? 'zh-CN' : 'en-US';

  const currencySelect = document.querySelector('#currencySelect');
  const currencyInputs = [...document.querySelectorAll('[data-currency-input]')];
  const propertyType = document.querySelector('#propertyType');
  const budgetShare = document.querySelector('#budgetShare');

  let fxRates = {};
  let activeInputCurrency = 'KRW';
  let dongs = null;      // last successful payload for the current property type
  let loadState = 'loading';

  // --- currency plumbing, same contract as the other tools -------------------

  function getWon(input) {
    if (!input || !input.dataset || !('krwValue' in input.dataset)) return null;
    const value = Number(input.dataset.krwValue);
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  function syncInput(input) {
    const amount = KHGCurrency.parseInputAmount(input.value);
    const won = KHGCurrency.convertToKrw(amount, activeInputCurrency, fxRates);
    if (won == null || won < 0) {
      delete input.dataset.krwValue;
      input.setAttribute('aria-invalid', 'true');
      return false;
    }
    input.dataset.krwValue = String(Math.round(won));
    input.removeAttribute('aria-invalid');
    return true;
  }

  function renderInputs(currency) {
    if (currency !== 'KRW' && !Number(fxRates[currency])) return false;
    const values = currencyInputs.map(input => ({ input, won: getWon(input) }));
    if (values.some(item => item.won == null)) return false;
    values.forEach(({ input, won }) => {
      input.value = KHGCurrency.formatInputAmount(KHGCurrency.convertFromKrw(won, currency, fxRates), currency, locale);
      const ref = document.querySelector(`[data-currency-reference-for="${input.id}"]`);
      if (ref) ref.textContent = currency === 'KRW' ? KHGCurrency.manwonLabel(won, language) : `≈ ${KHGCurrency.formatWon(won, locale)}`;
    });
    document.querySelectorAll('[data-currency-symbol]').forEach(el => { el.textContent = KHGCurrency.currencySymbol(currency); });
    activeInputCurrency = currency;
    render();
    return true;
  }

  function money(won) {
    return KHGCurrency.formatMoneyHtml(Math.round(won), currencySelect.value, fxRates, locale);
  }

  // --- the arithmetic --------------------------------------------------------

  function median(values) {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return null;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  // Prefer the contextual figures — the provider picks the most comparable
  // subset of contracts for them — and fall back to the plain medians.
  function normalizeDong(item) {
    const depositWon = Number(item.contextualMedianDepositWon ?? item.medianDepositWon);
    const rentWon = Number(item.contextualMedianMonthlyRentWon ?? item.medianMonthlyRentWon);
    const contracts = Number(item.contextualMonthlyRentCount ?? item.monthlyRentCount);
    if (!Number.isFinite(depositWon) || depositWon < 0) return null;
    if (!Number.isFinite(rentWon) || rentWon <= 0) return null;
    if (!Number.isFinite(contracts) || contracts < MIN_CONTRACTS) return null;
    return {
      dong: String(item.dong || ''),
      districtName: String(item.districtName || ''),
      depositWon,
      rentWon,
      contracts
    };
  }

  // The gap depends only on the deposit difference — the rent cancels out — so
  // it is the same number in every neighborhood with the same deposit.
  function depositGapPerMonth(depositWon, cashWon) {
    return (depositWon - cashWon) * RATE / 12;
  }

  function priceAtCash(item, cashWon) {
    // Arithmetic can push this below zero when someone's cash far exceeds the
    // usual deposit. Zero rent is not a real quote, so clamp it.
    return Math.max(0, monthlyRentAtDeposit(item.rentWon, item.depositWon, cashWon));
  }

  // --- rendering -------------------------------------------------------------

  const budgetResult = document.querySelector('#budgetResult');
  const budgetBasis = document.querySelector('#budgetBasis');
  const penaltyResult = document.querySelector('#penaltyResult');
  const penaltyBasis = document.querySelector('#penaltyBasis');
  const resultsStatus = document.querySelector('#resultsStatus');
  const resultsTable = document.querySelector('#resultsTable');
  const resultsBody = document.querySelector('#resultsBody');
  const resultsMore = document.querySelector('#resultsMore');
  const resultsTitle = document.querySelector('#resultsTitle');

  function setStatus(text) {
    resultsStatus.textContent = text;
    resultsStatus.hidden = !text;
  }

  function clearOutputs(message) {
    budgetResult.innerHTML = '—';
    budgetBasis.textContent = message || '';
    penaltyResult.innerHTML = '—';
    penaltyBasis.textContent = '';
    resultsTable.hidden = true;
    resultsMore.hidden = true;
  }

  function render() {
    const salaryWon = getWon(document.querySelector('#salary'));
    const cashWon = getWon(document.querySelector('#cash'));
    const netMonthlyWon = getWon(document.querySelector('#netMonthly'));

    if (salaryWon == null || cashWon == null || netMonthlyWon == null) {
      clearOutputs('Enter valid non-negative amounts.');
      return;
    }

    const usingNet = netMonthlyWon > 0;
    const monthlyIncomeWon = usingNet ? netMonthlyWon : salaryWon / 12;
    const share = Number(budgetShare.value) || 0.3;
    const budgetWon = monthlyIncomeWon * share;

    budgetResult.innerHTML = money(budgetWon);
    budgetBasis.textContent = usingNet
      ? `${Math.round(share * 100)}% of the take-home pay you entered.`
      : `${Math.round(share * 100)}% of salary ÷ 12, before tax. Take-home is lower — enter it above for a truer number.`;

    if (loadState === 'loading') { setStatus('Loading recent contracts…'); return; }
    if (loadState === 'error' || !dongs) {
      setStatus('Recent contract data is temporarily unavailable. The budget above still applies.');
      penaltyResult.innerHTML = '—';
      penaltyBasis.textContent = '';
      return;
    }

    const usable = dongs.map(normalizeDong).filter(Boolean);
    if (!usable.length) {
      setStatus('No neighborhood in the recent window has enough monthly-rent contracts to report.');
      return;
    }

    // Headline: the deposit gap against what this market normally expects.
    const typicalDepositWon = median(usable.map(item => item.depositWon));
    const gapWon = depositGapPerMonth(typicalDepositWon, cashWon);
    if (gapWon > 0) {
      penaltyResult.innerHTML = `+${money(gapWon)}<span class="unit"> / mo</span>`;
      penaltyBasis.textContent = `Typical deposit here is ${KHGCurrency.formatWon(Math.round(typicalDepositWon), locale)}; you have ${KHGCurrency.formatWon(cashWon, locale)}. That gap adds about ${KHGCurrency.formatWon(Math.round(gapWon * 12), locale)} a year.`;
    } else {
      penaltyResult.innerHTML = `−${money(Math.abs(gapWon))}<span class="unit"> / mo</span>`;
      penaltyBasis.textContent = `Your cash is above the typical ${KHGCurrency.formatWon(Math.round(typicalDepositWon), locale)} deposit, which buys the rent down by roughly this much.`;
    }

    const priced = usable
      .map(item => {
        const yourRentWon = priceAtCash(item, cashWon);
        return { ...item, yourRentWon, gapWon: yourRentWon - item.rentWon };
      })
      .filter(item => item.yourRentWon <= budgetWon)
      .sort((a, b) => a.yourRentWon - b.yourRentWon);

    resultsTitle.textContent = 'Neighborhoods you can reach';

    if (!priced.length) {
      setStatus(`No neighborhood in the recent window comes in under ${KHGCurrency.formatWon(Math.round(budgetWon), locale)} a month at your deposit. Raising the deposit, or the share of income, changes this most.`);
      resultsTable.hidden = true;
      resultsMore.hidden = true;
      return;
    }

    setStatus(`${priced.length} of ${usable.length} neighborhoods come in under ${KHGCurrency.formatWon(Math.round(budgetWon), locale)} a month at your deposit.`);

    const rows = priced.slice(0, MAX_ROWS);
    resultsBody.innerHTML = rows.map(item => {
      const gapCell = Math.abs(item.gapWon) < 1000
        ? '<span class="muted">—</span>'
        : `${item.gapWon > 0 ? '+' : '−'}${money(Math.abs(item.gapWon))}`;
      return `<tr>
        <th scope="row">${escapeHtml(item.dong)}<br><small>${escapeHtml(item.districtName)}</small></th>
        <td>${money(item.depositWon)}</td>
        <td>${money(item.rentWon)}</td>
        <td><strong>${money(item.yourRentWon)}</strong></td>
        <td>${gapCell}</td>
        <td>${item.contracts}</td>
      </tr>`;
    }).join('');
    resultsTable.hidden = false;

    if (priced.length > rows.length) {
      resultsMore.textContent = `Showing the ${rows.length} cheapest of ${priced.length}.`;
      resultsMore.hidden = false;
    } else {
      resultsMore.hidden = true;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[ch]);
  }

  // --- data ------------------------------------------------------------------

  async function loadMarket() {
    loadState = 'loading';
    dongs = null;
    render();
    try {
      const response = await fetch(`/api/explore-seoul?type=${encodeURIComponent(propertyType.value)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload && payload.error);
      dongs = Array.isArray(payload.dongs) ? payload.dongs : [];
      loadState = 'ready';
    } catch (_) {
      loadState = 'error';
      dongs = null;
    }
    render();
  }

  // --- wiring ----------------------------------------------------------------

  currencyInputs.forEach(input => {
    input.addEventListener('input', () => {
      const amount = KHGCurrency.parseInputAmount(input.value);
      if (amount != null) input.value = KHGCurrency.formatInputAmount(amount, activeInputCurrency, locale);
      syncInput(input);
      render();
    });
  });
  budgetShare.addEventListener('change', render);
  propertyType.addEventListener('change', loadMarket);
  currencySelect.addEventListener('change', () => {
    const valid = currencyInputs.every(syncInput);
    if (!valid || !renderInputs(currencySelect.value)) currencySelect.value = activeInputCurrency;
  });
  document.querySelector('#planForm').addEventListener('submit', event => event.preventDefault());

  const conversionNote = document.querySelector('#conversionNote');
  if (conversionNote) {
    conversionNote.textContent = `Deposit and rent are traded at ${(RATE * 100).toFixed(1)}% a year — the ${DEPOSIT_CONVERSION_REFERENCE.basis}, as of ${DEPOSIT_CONVERSION_REFERENCE.asOf}. Landlords convert at their own rate, so treat every converted figure as an estimate.`;
  }

  (async () => {
    currencySelect.disabled = true;
    try {
      const response = await fetch('/api/fx');
      const payload = await response.json();
      if (!response.ok) throw new Error();
      fxRates = payload.rates || {};
      if (!renderInputs(currencySelect.value)) {
        currencySelect.value = activeInputCurrency;
        renderInputs(activeInputCurrency);
      }
    } catch (_) {
      fxRates = {};
      currencySelect.value = 'KRW';
      renderInputs('KRW');
    } finally {
      currencySelect.disabled = false;
    }
    loadMarket();
  })();
})();
