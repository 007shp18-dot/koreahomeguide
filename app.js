const neighborhoods = [
  { key:"gangnam", name:"Gangnam", district:"Gangnam-gu", lawdCd:"11680", lat:37.4979, lng:127.0276, description:"Major business district with dense transit, offices, shopping and late-night amenities.", tags:["Commute-first","Business district","Metro access"] },
  { key:"seongsu", name:"Seongsu", district:"Seongdong-gu", lawdCd:"11200", lat:37.5445, lng:127.0560, description:"Lifestyle-heavy neighborhood known for cafés, creative spaces and access to eastern Seoul.", tags:["Cafés","Lifestyle","Line 2"] },
  { key:"hongdae", name:"Hongdae", district:"Mapo-gu", lawdCd:"11440", lat:37.5563, lng:126.9237, description:"Lively university area with nightlife, restaurants and convenient airport-rail access.", tags:["Nightlife","Students","Airport rail"] },
  { key:"itaewon", name:"Itaewon", district:"Yongsan-gu", lawdCd:"11170", lat:37.5345, lng:126.9946, description:"International dining and nightlife hub with a long-established foreign resident community.", tags:["International","Dining","Central Seoul"] },
  { key:"yeouido", name:"Yeouido", district:"Yeongdeungpo-gu", lawdCd:"11560", lat:37.5219, lng:126.9245, description:"Finance and office district with strong subway access, parks and high-rise housing.", tags:["Finance","Office district","Parks"] },
  { key:"wangsimni", name:"Wangsimni", district:"Seongdong-gu", lawdCd:"11200", lat:37.5611, lng:127.0379, description:"Practical multi-line transit hub for reaching several major parts of Seoul.", tags:["Transit hub","Practical","Central access"] }
];

const resultList = document.querySelector("#resultList");
const resultTitle = document.querySelector("#resultTitle");
const resultCount = document.querySelector("#resultCount");
const areaSearch = document.querySelector("#areaSearch");
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
  return KHGCurrency.formatMoneyHtml(amountWon, selectedCurrency(), fxRates, "en-US");
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
    if (reference) reference.textContent = currency === "KRW" ? "" : `≈ ${KHGCurrency.formatWon(won, "en-US")}`;
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
    if (currencySelect) currencySelect.title = `Reference FX {date} · approximate only`.replace('{date}', fxRateDate ? KHGDate.formatDate(fxRateDate, 'en-US') : "latest");
    const requested = selectedCurrency();
    if (!activateCurrency(requested) && currencySelect) {
      currencySelect.value = "KRW";
      activateCurrency("KRW");
    }
  } catch (error) {
    fxRates = {};
    if (currencySelect) {
      currencySelect.value = "KRW";
      currencySelect.title = "FX reference temporarily unavailable · KRW mode";
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

function renderCards(items, query = "") {
  resultList.innerHTML = "";
  resultCount.textContent = `${items.length} ${items.length === 1 ? "area" : "areas"}`;
  resultTitle.textContent = query ? `Results for “${query}”` : "Explore Seoul neighborhoods";

  if (!items.length) {
    resultList.innerHTML = `<div class="notice neutral-notice">No neighborhood in the starter index matches that search yet. Try Gangnam, Seongsu, Hongdae, Itaewon, Yeouido or Wangsimni.</div>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "result-card";
    card.innerHTML = `
      <div>
        <h3>${item.name} <span style="font-size:11px;color:#7a857e;font-weight:600">${item.district}</span></h3>
        <p>${item.description}</p>
        <div class="tags">
          ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
          ${homeType.value ? `<span class="tag">${homeType.options[homeType.selectedIndex].text}</span>` : ""}
          ${rentBudget.value ? `<span class="tag">Signed rent filter</span>` : ""}
          ${depositBudget.value ? `<span class="tag">Signed deposit filter</span>` : ""}
        </div>
      </div>
      <div class="card-actions">
        <button class="card-action" type="button" data-focus="${item.key}">Explore area</button>
        <button class="card-action primary-action" type="button" data-real-price="${item.key}">View official rent data</button>
      </div>`;
    resultList.appendChild(card);
  });

  document.querySelectorAll("[data-focus]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = neighborhoods.find(n => n.key === button.dataset.focus);
      if (item && map) {
        map.setView([item.lat, item.lng], 14);
        markerByKey[item.key].openPopup();
      }
    });
  });

  document.querySelectorAll("[data-real-price]").forEach((button) => {
    button.addEventListener("click", async () => {
      const item = neighborhoods.find(n => n.key === button.dataset.realPrice);
      if (!item) return;
      const selection = KHGRealPrices.buildRealPriceSelection(item, homeType.value);
      priceArea.value = selection.lawdCd;
      setPriceType(selection.priceType);
      if (rentCheckArea) rentCheckArea.value = selection.lawdCd;
      if (rentCheckType) rentCheckType.value = homeType.value || selection.priceType;
      updateRentCheckStudioNote();
      document.querySelector("#real-prices").scrollIntoView({ behavior:"smooth", block:"start" });
      await loadRealPrices();
    });
  });
}

function runSearch() {
  const q = areaSearch.value.trim().toLowerCase();
  const items = q ? neighborhoods.filter(n =>
    n.name.toLowerCase().includes(q) || n.district.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
  ) : neighborhoods;
  renderCards(items, areaSearch.value.trim());
  if (items.length && map) {
    const bounds = L.latLngBounds(items.map(n => [n.lat, n.lng]));
    map.fitBounds(bounds.pad(0.35));
  }
}

document.querySelector("#searchBtn").addEventListener("click", runSearch);
areaSearch.addEventListener("keydown", e => { if (e.key === "Enter") runSearch(); });
[rentBudget, depositBudget, homeType].forEach(el => el.addEventListener("change", runSearch));
document.querySelectorAll("[data-area]").forEach(btn => btn.addEventListener("click", () => { areaSearch.value = btn.dataset.area; runSearch(); }));

let map = null;
const markerByKey = {};
if (window.L) {
  map = L.map("map", { scrollWheelZoom:false }).setView([37.5665,126.9780],11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom:18, attribution:"&copy; OpenStreetMap contributors" }).addTo(map);
  neighborhoods.forEach(item => {
    const marker = L.marker([item.lat,item.lng]).addTo(map);
    marker.bindPopup(`<strong>${item.name}</strong><br>${item.district}<br><small>${item.tags.join(" · ")}</small>`);
    markerByKey[item.key] = marker;
  });
}


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
    ? "Below ₩50M → deposit + monthly rent × 70"
    : "Deposit + monthly rent × 100";
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
renderCards(neighborhoods);

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
    rentCheckComparableBody.innerHTML = '<tr class="empty-row"><td colspan="5">No reliable comparable set is available for this quote.</td></tr>';
    return;
  }
  rentCheckComparableBody.innerHTML = items.map(item => `
    <tr>
      <td>${item.building || '-'}</td>
      <td>${Number.isFinite(Number(item.areaSqm)) ? `${Number(item.areaSqm).toFixed(1)}㎡` : '-'}</td>
      <td>${moneyHtml(item.depositWon)}</td>
      <td>${moneyHtml(item.monthlyRentWon)}</td>
      <td>${KHGDate.formatDate(item.contractDate, 'en-US')}</td>
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
    ? `Searched up to ${months} completed months. The dataset is too thin for a reliable judgment.`
    : `${count} comparable ${count === 1 ? 'contract' : 'contracts'} · last ${months} completed months.`;
  rentCheckEvidenceSummary.textContent = data.rating === 'insufficient'
    ? `${count} possible matches found; at least 3 suitable contracts are required.`
    : `${count} signed contracts matched the selected comparison tier.`;
  renderRentCheckRows(data.comparables || []);
}

async function runRentCheck(event) {
  if (event) event.preventDefault();
  syncCurrencyInput(rentCheckDeposit);
  syncCurrencyInput(rentCheckRent);
  const depositWon = getInputWon(rentCheckDeposit);
  const rentWon = getInputWon(rentCheckRent);
  const areaSqm = Number(rentCheckAreaSqm.value);
  if (!Number.isFinite(depositWon) || depositWon < 0) return setRentCheckStatus('Deposit must be zero or greater.', 'error');
  if (!Number.isFinite(rentWon) || rentWon < 0) return setRentCheckStatus('Monthly rent must be zero or greater.', 'error');
  if (!Number.isFinite(areaSqm) || areaSqm <= 0) return setRentCheckStatus('Size must be greater than zero.', 'error');

  const mappedType = KHGRentCheckUI.mapRentCheckType(rentCheckType.value);
  updateRentCheckStudioNote();
  setRentCheckStatus('Finding similar official signed contracts…', 'loading');
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
    if (!response.ok) throw new Error(data.error || 'Failed to compare this rent.');
    renderRentCheckResult(data);
    setRentCheckStatus(
      data.rating === 'insufficient'
        ? 'No market judgment was made because there are too few similar official contracts.'
        : 'Comparison complete. Review the signed contracts used below.',
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

if (priceMonth) priceMonth.value = KHGRealPrices.previousCompletedMonth(new Date());

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
  return type === "apartment" ? "Apartment" : type === "officetel" ? "Officetel" : "Villa / Multi-family";
}
function renderPriceRows(items) {
  lastPriceItems = items;
  if (!items.length) {
    priceTableBody.innerHTML = `<tr class="empty-row"><td colspan="6">No matching contracts returned for this area and month.</td></tr>`;
    return;
  }
  priceTableBody.innerHTML = items.slice(0,40).map(item => `
    <tr><td>${item.building || "-"}</td><td>${typeLabel(priceType.value)}</td><td>${item.area ? `${item.area}㎡` : "-"}</td><td>${formatMoneyFromManwon(item.deposit)}</td><td>${formatMoneyFromManwon(item.monthlyRent)}</td><td>${KHGDate.formatDate(item.contractDate, 'en-US')}</td></tr>`).join("");
}

async function loadRealPrices() {
  const ym = (priceMonth.value || "").replace("-","");
  if (!/^\d{6}$/.test(ym)) {
    priceStatus.textContent = "Choose a valid contract month.";
    priceStatus.className = "price-status error";
    return;
  }
  priceStatus.textContent = "Loading official signed-rent data...";
  priceStatus.className = "price-status";
  loadPricesBtn.disabled = true;
  try {
    const url = `/api/real-prices?type=${encodeURIComponent(priceType.value)}&lawdCd=${encodeURIComponent(priceArea.value)}&dealYmd=${encodeURIComponent(ym)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load data.");
    const allItems = data.items || [];
    const filteredItems = KHGRealPrices.filterTransactions(allItems, {
      rentBudgetWon:Number(rentBudget.value || 0),
      depositBudgetWon:Number(depositBudget.value || 0)
    });
    renderPriceRows(filteredItems);
    const hasBudget = rentBudget.value || depositBudget.value;
    const studioNote = homeType.value === "studio" && priceType.value === "villa" ? " Studio is not an official category, so villa/multi-family contracts are used as the nearest comparable set." : "";
    priceStatus.textContent = hasBudget
      ? `Showing ${filteredItems.length} of ${allItems.length} official contracts matching your search budget.${studioNote}`
      : `Loaded ${allItems.length} official signed-rent records.${studioNote}`;
    priceStatus.className = "price-status success";
  } catch (err) {
    lastPriceItems = null;
    const friendlyMessage = KHGApiErrors.humanizePriceError(err.message, priceType.value);
    priceTableBody.innerHTML = `<tr class="empty-row"><td colspan="6">${friendlyMessage}</td></tr>`;
    priceStatus.textContent = friendlyMessage;
    priceStatus.className = "price-status error";
  } finally {
    loadPricesBtn.disabled = false;
  }
}
loadPricesBtn.addEventListener("click", loadRealPrices);

loadFxRates();
