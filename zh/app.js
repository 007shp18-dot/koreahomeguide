const findDistrict = document.querySelector("#findDistrict");
const rentBudget = document.querySelector("#rentBudget");
const depositBudget = document.querySelector("#depositBudget");
const homeType = document.querySelector("#homeType");
const rentCheckForm = document.querySelector("#rentCheckForm");
const rentCheckArea = document.querySelector("#rentCheckArea");
const rentCheckType = document.querySelector("#rentCheckType");
const rentCheckDeposit = document.querySelector("#rentCheckDeposit");
const rentCheckRent = document.querySelector("#rentCheckRent");
const rentCheckAreaSqm = document.querySelector("#rentCheckAreaSqm");
const rentCheckButton = document.querySelector("#rentCheckButton");
const rentCheckStatus = document.querySelector("#rentCheckStatus");
const rentCheckResult = document.querySelector("#rentCheckResult");
const rentCheckRating = document.querySelector("#rentCheckRating");
const rentCheckConfidence = document.querySelector("#rentCheckConfidence");
const rentCheckMessage = document.querySelector("#rentCheckMessage");
const rentCheckMeta = document.querySelector("#rentCheckMeta");
const rentCheckAsking = document.querySelector("#rentCheckAsking");
const rentCheckMedian = document.querySelector("#rentCheckMedian");
const rentCheckDifference = document.querySelector("#rentCheckDifference");
const rentCheckEvidenceSummary = document.querySelector("#rentCheckEvidenceSummary");
const rentCheckComparableBody = document.querySelector("#rentCheckComparableBody");
const rentCheckStudioNote = document.querySelector("#rentCheckStudioNote");

const currencySelect = document.querySelector("#currencySelect");
const currencyInputs = [...document.querySelectorAll("[data-currency-input]")];
let fxRates = {};
let fxRateDate = null;
let lastRentCheckData = null;
let lastPriceItems = null;
let activeInputCurrency = "KRW";

currencyInputs.forEach((input) => {
  input.dataset.wonValue = String(Number(input.value || 0));
  input.dataset.krwStep = input.step || "1";
});
if (currencySelect) currencySelect.disabled = true;

function selectedCurrency() {
  return currencySelect ? currencySelect.value : "KRW";
}

function moneyHtml(amountWon) {
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, "zh-CN");
}

function syncCurrencyInput(input) {
  if (!input) return 0;
  const won = KHGCurrency.convertToKrw(Number(input.value || 0), activeInputCurrency, fxRates);
  if (won != null && Number.isFinite(won)) input.dataset.wonValue = String(Math.max(0, won));
  return Number(input.dataset.wonValue || 0);
}

function syncCurrencyInputs() {
  currencyInputs.forEach(syncCurrencyInput);
}

function getInputWon(input) {
  return Number(input && input.dataset.wonValue || 0);
}

function renderCurrencyInputs(currency) {
  if (currency !== "KRW") {
    const rate = Number(fxRates[currency]);
    if (!Number.isFinite(rate) || rate <= 0) return false;
  }
  currencyInputs.forEach((input) => {
    const won = Number(input.dataset.wonValue || 0);
    const shown = KHGCurrency.convertFromKrw(won, currency, fxRates);
    if (shown == null) return;
    input.value = KHGCurrency.formatInputAmount(shown, currency);
    input.step = currency === "KRW" ? (input.dataset.krwStep || "1") : "1";
    const reference = document.querySelector(`[data-krw-reference="${input.id}"]`);
    if (reference) reference.textContent = currency === "KRW" ? "" : `≈ ${KHGCurrency.formatWon(won, "zh-CN")}`;
  });
  document.querySelectorAll("[data-currency-symbol]").forEach((el) => {
    el.textContent = KHGCurrency.currencySymbol(currency);
  });
  activeInputCurrency = currency;
  return true;
}

function refreshCurrencyDisplays() {
  updateCalculator();
  if (lastRentCheckData) renderRentCheckResult(lastRentCheckData);
  if (lastPriceItems) renderPriceRows(lastPriceItems);
}

function activateCurrency(currency) {
  syncCurrencyInputs();
  if (!renderCurrencyInputs(currency)) return false;
  refreshCurrencyDisplays();
  return true;
}

async function loadFxRates() {
  try {
    const response = await fetch('/api/fx');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'FX unavailable');
    fxRates = data.rates || {};
    fxRateDate = data.date || null;
    if (currencySelect) currencySelect.title = `参考汇率 {date} · 仅供估算`.replace('{date}', fxRateDate ? KHGDate.formatDate(fxRateDate, 'zh-CN') : "最新");
    const requested = selectedCurrency();
    if (!activateCurrency(requested) && currencySelect) {
      currencySelect.value = "KRW";
      activateCurrency("KRW");
    }
  } catch (error) {
    fxRates = {};
    if (currencySelect) {
      currencySelect.value = "KRW";
      currencySelect.title = "汇率暂时不可用 · 已切换为 KRW";
    }
    renderCurrencyInputs("KRW");
    refreshCurrencyDisplays();
  } finally {
    if (currencySelect) currencySelect.disabled = false;
  }
}

if (currencySelect) {
  currencySelect.addEventListener('change', () => {
    const requested = currencySelect.value;
    if (!activateCurrency(requested)) currencySelect.value = activeInputCurrency;
  });
}

function runFindHome() {
  if (!findDistrict || !homeType) return;
  const params = new URLSearchParams({ lawdCd:findDistrict.value, type:homeType.value });
  if (rentBudget && rentBudget.value) params.set('maxRent', rentBudget.value);
  if (depositBudget && depositBudget.value) params.set('maxDeposit', depositBudget.value);
  window.location.href = `/zh/explore/?${params.toString()}`;
}

const findHomeButton = document.querySelector("#searchBtn");
if (findHomeButton) findHomeButton.addEventListener("click", runFindHome);

// ---- Brokerage + move-in calculator ----
const calcPropertyType = document.querySelector("#calcPropertyType");
const calcDeposit = document.querySelector("#deposit");
const calcRent = document.querySelector("#rent");
const calcMaintenance = document.querySelector("#maintenance");
const guaranteeInsurance = document.querySelector("#guaranteeInsurance");
const movingCleaning = document.querySelector("#movingCleaning");

function updateCalculator() {
  const depositWon = getInputWon(calcDeposit);
  const monthlyRentWon = getInputWon(calcRent);
  const summary = KHGBrokerage.calculateMoveInSummary({
    propertyType: calcPropertyType.value,
    depositWon,
    monthlyRentWon,
    maintenanceWon: getInputWon(calcMaintenance),
    guaranteeInsuranceWon: getInputWon(guaranteeInsurance),
    movingCleaningWon: getInputWon(movingCleaning)
  });
  const value100 = Math.max(0, depositWon) + Math.max(0, monthlyRentWon) * 100;
  document.querySelector("#transactionValueResult").innerHTML = moneyHtml(summary.transactionValueWon);
  document.querySelector("#transactionFormula").textContent = value100 < 50_000_000
    ? "低于 ₩50,000,000 → 押金 + 月租 × 70"
    : "押金 + 月租 × 100";
  document.querySelector("#brokerageRateResult").textContent = `${(summary.maxRate * 100).toFixed(1)}%`;
  document.querySelector("#brokerageFeeResult").innerHTML = moneyHtml(summary.brokerageMaxWon);
  document.querySelector("#calcResult").innerHTML = moneyHtml(summary.moveInCashWon);
  document.querySelector("#monthlyCostResult").innerHTML = moneyHtml(summary.monthlyRecurringWon);
}

document.querySelector("#calcForm").addEventListener("submit", e => e.preventDefault());
[calcDeposit,calcRent,calcMaintenance,guaranteeInsurance,movingCleaning].forEach(el => {
  el.addEventListener("input", () => { syncCurrencyInput(el); updateCalculator(); });
  el.addEventListener("change", () => { syncCurrencyInput(el); updateCalculator(); });
});
calcPropertyType.addEventListener("change", updateCalculator);
homeType.addEventListener("change", () => {
  if (homeType.value === "officetel") calcPropertyType.value = "officetel";
  else if (homeType.value) calcPropertyType.value = "housing";
  updateCalculator();
});
updateCalculator();

// ---- Compare this rent ----
function updateRentCheckStudioNote() {
  if (!rentCheckStudioNote || !rentCheckType) return;
  rentCheckStudioNote.hidden = rentCheckType.value !== 'studio';
}

function setRentCheckStatus(message, state = '') {
  if (!rentCheckStatus) return;
  rentCheckStatus.textContent = message;
  rentCheckStatus.className = `rent-check-status${state ? ` ${state}` : ''}`;
}

function renderRentCheckRows(items) {
  if (!items || !items.length) {
    rentCheckComparableBody.innerHTML = '<tr class="empty-row"><td colspan="5">暂时没有足够可靠的可比成交记录。</td></tr>';
    return;
  }
  rentCheckComparableBody.innerHTML = items.map(item => `
    <tr>
      <td>${item.building || '-'}</td>
      <td>${Number.isFinite(Number(item.areaSqm)) ? `${Number(item.areaSqm).toFixed(1)}㎡` : '-'}</td>
      <td>${moneyHtml(item.depositWon)}</td>
      <td>${moneyHtml(item.monthlyRentWon)}</td>
      <td>${KHGDate.formatDate(item.contractDate, 'zh-CN')}</td>
    </tr>
  `).join('');
}

function renderRentCheckResult(data) {
  lastRentCheckData = data;
  rentCheckResult.hidden = false;
  rentCheckRating.textContent = KHGRentCheckUI.ratingLabel(data.rating);
  rentCheckRating.className = `rent-rating ${data.rating || 'insufficient'}`;
  rentCheckMessage.textContent = KHGRentCheckUI.resultSentence(data);
  rentCheckAsking.innerHTML = moneyHtml(data.askingValueWon);
  rentCheckMedian.innerHTML = data.medianValueWon == null ? '-' : moneyHtml(data.medianValueWon);
  rentCheckDifference.textContent = data.differencePct == null ? '-' : KHGRentCheckUI.formatDifference(data.differencePct);

  if (data.confidence) {
    rentCheckConfidence.hidden = false;
    rentCheckConfidence.textContent = KHGRentCheckUI.confidenceLabel(data.confidence);
    rentCheckConfidence.className = `confidence-pill ${data.confidence}`;
  } else {
    rentCheckConfidence.hidden = true;
    rentCheckConfidence.textContent = '';
  }

  const count = Number(data.comparableCount || 0);
  const months = Number(data.monthsUsed || 12);
  rentCheckMeta.textContent = data.rating === 'insufficient'
    ? `已搜索最近 ${months} 个完整月份，但数据仍不足以做出可靠判断。`
    : `${count} 笔可比成交 · 最近 ${months} 个完整月份。`;
  rentCheckEvidenceSummary.textContent = data.rating === 'insufficient'
    ? `找到 ${count} 笔可能匹配的成交；至少需要 3 笔合适记录才能判断。`
    : `${count} 笔已签约成交符合当前比较条件。`;
  renderRentCheckRows(data.comparables || []);
}

async function runRentCheck(event) {
  if (event) event.preventDefault();
  syncCurrencyInput(rentCheckDeposit);
  syncCurrencyInput(rentCheckRent);
  const depositWon = getInputWon(rentCheckDeposit);
  const rentWon = getInputWon(rentCheckRent);
  const areaSqm = Number(rentCheckAreaSqm.value);
  if (!Number.isFinite(depositWon) || depositWon < 0) return setRentCheckStatus('押金必须为 0 或更大的金额。', 'error');
  if (!Number.isFinite(rentWon) || rentWon < 0) return setRentCheckStatus('月租必须为 0 或更大的金额。', 'error');
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) return setRentCheckStatus('面积必须大于 0。', 'error');

  const mappedType = KHGRentCheckUI.mapRentCheckType(rentCheckType.value);
  updateRentCheckStudioNote();
  setRentCheckStatus('正在查找类似的官方成交记录…', 'loading');
  rentCheckButton.disabled = true;

  try {
    const params = new URLSearchParams({
      lawdCd: rentCheckArea.value,
      type: mappedType.officialType,
      deposit: String(Math.round(depositWon)),
      rent: String(Math.round(rentWon)),
      area: String(areaSqm)
    });
    const response = await fetch(`/api/rent-check?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '租金比较失败。');
    renderRentCheckResult(data);
    setRentCheckStatus(
      data.rating === 'insufficient'
        ? '相似的官方成交记录太少，因此没有给出价格判断。'
        : '比较完成。你可以在下方查看本次使用的真实签约记录。',
      data.rating === 'insufficient' ? '' : 'success'
    );
  } catch (error) {
    rentCheckResult.hidden = true;
    setRentCheckStatus(KHGRentCheckUI.humanizeRentCheckError(error.message), 'error');
  } finally {
    rentCheckButton.disabled = false;
  }
}

if (rentCheckForm) rentCheckForm.addEventListener('submit', runRentCheck);
[rentCheckDeposit, rentCheckRent].forEach((el) => {
  if (!el) return;
  el.addEventListener('input', () => syncCurrencyInput(el));
  el.addEventListener('change', () => syncCurrencyInput(el));
});
if (rentCheckType) rentCheckType.addEventListener('change', updateRentCheckStudioNote);
updateRentCheckStudioNote();

// ---- Official MOLIT rental transaction data ----
const priceArea = document.querySelector("#priceArea");
const priceType = document.querySelector("#priceType");
const priceMonth = document.querySelector("#priceMonth");
const priceStatus = document.querySelector("#priceStatus");
const priceTableBody = document.querySelector("#priceTableBody");
const loadPricesBtn = document.querySelector("#loadPricesBtn");
const propertyTabs = [...document.querySelectorAll("[data-price-type]")];

if (priceMonth) {
  const values = KHGRealPrices.recentCompletedMonths(new Date(), 60);
  priceMonth.innerHTML = values.map(value => `<option value="${value}">${KHGDate.formatMonth(value, 'zh-CN')}</option>`).join('');
  priceMonth.value = KHGRealPrices.previousCompletedMonth(new Date());
}

function setPriceType(type) {
  const supported = ["apartment","officetel","villa"];
  const next = supported.includes(type) ? type : "apartment";
  priceType.value = next;
  propertyTabs.forEach(tab => tab.classList.toggle("active", tab.dataset.priceType === next));
}
propertyTabs.forEach(tab => tab.addEventListener("click", () => setPriceType(tab.dataset.priceType)));
setPriceType(priceType.value);

function formatMoneyFromManwon(value) {
  const num = Number(String(value || "0").replace(/,/g, "").trim());
  if (!Number.isFinite(num)) return "-";
  return moneyHtml(num * 10000);
}
function typeLabel(type) {
  return type === "apartment" ? "公寓" : type === "officetel" ? "Officetel" : "Villa / 多户住宅";
}
function renderPriceRows(items) {
  lastPriceItems = items;
  if (!items.length) {
    priceTableBody.innerHTML = `<tr class="empty-row"><td colspan="6">该地区和月份没有返回符合条件的成交记录。</td></tr>`;
    return;
  }
  priceTableBody.innerHTML = items.slice(0,40).map(item => `
    <tr><td>${item.building || "-"}</td><td>${typeLabel(priceType.value)}</td><td>${item.area ? `${item.area}㎡` : "-"}</td><td>${formatMoneyFromManwon(item.deposit)}</td><td>${formatMoneyFromManwon(item.monthlyRent)}</td><td>${KHGDate.formatDate(item.contractDate, 'zh-CN')}</td></tr>`).join("");
}

async function loadRealPrices() {
  const ym = (priceMonth.value || "").replace("-","");
  if (!/^\d{6}$/.test(ym)) {
    priceStatus.textContent = "请选择有效的签约月份。";
    priceStatus.className = "price-status error";
    return;
  }
  priceStatus.textContent = "正在加载官方租赁成交数据...";
  priceStatus.className = "price-status";
  loadPricesBtn.disabled = true;
  try {
    const url = `/api/real-prices?type=${encodeURIComponent(priceType.value)}&lawdCd=${encodeURIComponent(priceArea.value)}&dealYmd=${encodeURIComponent(ym)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "加载数据失败。");
    const allItems = data.items || [];
    const filteredItems = KHGRealPrices.filterTransactions(allItems, {
      rentBudgetWon:Number(rentBudget.value || 0),
      depositBudgetWon:Number(depositBudget.value || 0)
    });
    renderPriceRows(filteredItems);
    const hasBudget = rentBudget.value || depositBudget.value;
    const studioNote = homeType.value === "studio" && priceType.value === "villa" ? " 官方数据没有单独的“单间”类别，因此使用 Villa / 多户住宅作为最接近的参考。" : "";
    priceStatus.textContent = hasBudget
      ? `显示 ${filteredItems.length} / ${allItems.length} 笔符合预算条件的官方成交记录。${studioNote}`
      : `已加载 ${allItems.length} 笔官方租赁成交记录。${studioNote}`;
    priceStatus.className = "price-status success";
  } catch (err) {
    lastPriceItems = null;
    const friendlyMessage = "官方成交数据暂时无法加载，请稍后再试。";
    priceTableBody.innerHTML = `<tr class="empty-row"><td colspan="6">${friendlyMessage}</td></tr>`;
    priceStatus.textContent = friendlyMessage;
    priceStatus.className = "price-status error";
  } finally {
    loadPricesBtn.disabled = false;
  }
}
loadPricesBtn.addEventListener("click", loadRealPrices);

loadFxRates();
