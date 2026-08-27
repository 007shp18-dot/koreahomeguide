(function(root) {
  'use strict';
  if (!root || !root.document || !root.KHGSavedQuotes || !root.KHGCurrency) return;
  const doc = root.document;
  const language = doc.documentElement.lang === 'zh-CN' ? 'zh-CN' : 'en';
  const zh = language === 'zh-CN';
  const locale = zh ? 'zh-CN' : 'en-US';
  let storage = null;
  let sessionStorage = null;
  try { storage = root.localStorage; } catch (_) {}
  try { sessionStorage = root.sessionStorage; } catch (_) {}
  const store = root.KHGSavedQuotes.createStore({ storage });
  const listNode = doc.querySelector('#savedHomesList');
  const compareNode = doc.querySelector('#savedHomesComparison');
  const emptyNode = doc.querySelector('#savedHomesEmpty');
  const countNode = doc.querySelector('#savedHomesCount');
  const currencySelect = doc.querySelector('#currencySelect');
  const clearButton = doc.querySelector('#savedHomesClear');
  const statusNode = doc.querySelector('#savedHomesStatus');
  let selected = new Set();
  let rates = {};
  let openedTracked = false;
  let comparedSignature = '';

  function ratingLabel(value) {
    const labels = zh
      ? { above:'高于近期典型区间', fair:'接近近期典型区间', below:'低于近期典型区间', insufficient:'数据不足' }
      : { above:'Above recent typical range', fair:'Near recent typical range', below:'Below recent typical range', insufficient:'Not enough data' };
    return labels[value] || labels.insufficient;
  }

  function confidenceLabel(value) {
    const labels = zh ? { high:'依据较强', medium:'依据中等', low:'依据有限' } : { high:'Strong evidence', medium:'Moderate evidence', low:'Limited evidence' };
    return labels[value] || (zh ? '未提供依据等级' : 'Evidence level unavailable');
  }

  function moneyHtml(value) {
    return root.KHGCurrency.formatMoneyHtml(value, currencySelect ? currencySelect.value : 'KRW', rates, locale);
  }

  function textCell(text, tag = 'td') {
    const cell = doc.createElement(tag);
    cell.textContent = text;
    return cell;
  }

  function moneyCell(value) {
    const cell = doc.createElement('td');
    cell.innerHTML = moneyHtml(value);
    return cell;
  }

  function percentText(value) {
    if (!Number.isFinite(value)) return '—';
    const formatted = value.toLocaleString(locale, { maximumFractionDigits:1 });
    return `${value > 0 ? '+' : ''}${formatted}%`;
  }

  function displayName(quote) {
    return quote.label || root.KHGSavedQuotes.defaultLabel(quote, language);
  }

  function setStatus(message, tone = '') {
    if (!statusNode) return;
    statusNode.textContent = message || '';
    statusNode.className = `saved-homes-page-status${tone ? ` ${tone}` : ''}`;
  }

  function safeTrack(eventName, count) {
    try {
      if (typeof root.gtag !== 'function') return false;
      root.gtag('event', eventName, { language, saved_count_bucket:root.KHGSavedQuotes.countBucket(count) });
      return true;
    } catch (_) { return false; }
  }

  function trackOpened() {
    if (openedTracked) return;
    const count = store.list().length;
    if (!safeTrack('saved_quotes_opened', count)) return;
    if (count > 0 && root.KHGSavedQuotes.markComparisonVisit(storage)) {
      safeTrack('saved_quotes_return_visit', count);
    }
    openedTracked = true;
  }

  function comparisonRows() {
    return [
      [zh ? '地区与类型' : 'Area and type', quote => `${root.KHGSavedQuotes.districtLabel(quote.districtCode, language)} · ${root.KHGSavedQuotes.propertyLabel(quote.propertyType, language)}`],
      [zh ? '面积' : 'Size', quote => `${quote.areaSqm.toLocaleString(locale)}㎡`],
      [zh ? '押金' : 'Deposit', quote => ({ money:quote.depositWon })],
      [zh ? '月租' : 'Monthly rent', quote => ({ money:quote.monthlyRentWon })],
      [zh ? '可比成交中位数' : 'Comparable median', quote => quote.medianValueWon == null ? '—' : ({ money:quote.medianValueWon })],
      [zh ? '与中位数的差异' : 'Difference from median', quote => percentText(quote.differencePct)],
      [zh ? '近期成交判断' : 'Recent-contract verdict', quote => ratingLabel(quote.rating)],
      [zh ? '依据等级' : 'Evidence level', quote => confidenceLabel(quote.confidence)],
      [zh ? '可比成交数量' : 'Comparable contracts', quote => String(quote.comparableCount)],
      [zh ? '数据截至月份' : 'Data through', quote => quote.dataThroughMonth || '—'],
      [zh ? '保存日期' : 'Saved', quote => new Date(quote.savedAt).toLocaleDateString(locale)]
    ];
  }

  function renderComparisonCards(chosen, rows) {
    const cards = doc.createElement('div');
    cards.className = 'saved-homes-comparison-cards';
    chosen.forEach(quote => {
      const card = doc.createElement('article');
      const heading = doc.createElement('h3');
      heading.textContent = displayName(quote);
      card.appendChild(heading);
      rows.forEach(([label, valueFor]) => {
        const item = doc.createElement('div');
        const name = doc.createElement('span');
        const value = doc.createElement('strong');
        name.textContent = label;
        const output = valueFor(quote);
        if (output && typeof output === 'object') value.innerHTML = moneyHtml(output.money);
        else value.textContent = output;
        item.append(name, value);
        card.appendChild(item);
      });
      cards.appendChild(card);
    });
    return cards;
  }

  function renderComparison(quotes) {
    compareNode.textContent = '';
    const chosen = quotes.filter(quote => selected.has(quote.id)).slice(0, 4);
    if (!chosen.length) {
      const message = doc.createElement('p');
      message.className = 'saved-homes-select-note';
      message.textContent = zh ? '选择1至4个房源进行并排比较。' : 'Select one to four homes for a side-by-side comparison.';
      compareNode.appendChild(message);
      return;
    }

    const tableWrap = doc.createElement('div');
    tableWrap.className = 'saved-homes-table-wrap';
    const table = doc.createElement('table');
    table.className = 'saved-homes-table';
    const head = doc.createElement('thead');
    const headRow = doc.createElement('tr');
    headRow.appendChild(textCell(zh ? '比较项目' : 'Compare', 'th'));
    chosen.forEach(quote => headRow.appendChild(textCell(displayName(quote), 'th')));
    head.appendChild(headRow);
    table.appendChild(head);
    const body = doc.createElement('tbody');
    const rows = comparisonRows();
    rows.forEach(([label, valueFor]) => {
      const row = doc.createElement('tr');
      row.appendChild(textCell(label, 'th'));
      chosen.forEach(quote => {
        const value = valueFor(quote);
        row.appendChild(value && typeof value === 'object' ? moneyCell(value.money) : textCell(value));
      });
      body.appendChild(row);
    });
    table.appendChild(body);
    tableWrap.appendChild(table);
    compareNode.appendChild(tableWrap);
    compareNode.appendChild(renderComparisonCards(chosen, rows));
    const note = doc.createElement('p');
    note.className = 'saved-homes-limit-note';
    note.textContent = zh
      ? '此表不包含管理费、水电、楼层、装修、通勤或押金安全。它只整理你输入的报价与当时的官方成交参考。'
      : 'This table does not include management fees, utilities, floor, condition, commute, or deposit safety. It only organizes your quotes and the official transaction reference shown when saved.';
    compareNode.appendChild(note);
    const signature = chosen.map(quote => quote.id).sort().join('|');
    if (signature !== comparedSignature) {
      safeTrack('saved_quotes_compared', chosen.length);
      comparedSignature = signature;
    }
  }

  function render() {
    const quotes = store.list();
    if (!selected.size) quotes.slice(0, Math.min(4, quotes.length)).forEach(quote => selected.add(quote.id));
    selected = new Set([...selected].filter(id => quotes.some(quote => quote.id === id)).slice(0, 4));
    listNode.textContent = '';
    countNode.textContent = zh ? `当前浏览器中保存了 ${quotes.length} 个房源` : `${quotes.length} saved home${quotes.length === 1 ? '' : 's'} in this browser`;
    emptyNode.hidden = quotes.length > 0;
    clearButton.hidden = quotes.length === 0;

    quotes.forEach(quote => {
      const card = doc.createElement('article');
      card.className = 'saved-home-card';
      const selectLabel = doc.createElement('label');
      selectLabel.className = 'saved-home-select';
      const checkbox = doc.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selected.has(quote.id);
      checkbox.setAttribute('aria-label', zh ? `比较 ${displayName(quote)}` : `Compare ${displayName(quote)}`);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked && selected.size >= 4) {
          checkbox.checked = false;
          return;
        }
        if (checkbox.checked) selected.add(quote.id); else selected.delete(quote.id);
        renderComparison(quotes);
      });
      const name = doc.createElement('span');
      name.textContent = displayName(quote);
      selectLabel.append(checkbox, name);
      const meta = doc.createElement('p');
      meta.textContent = `${root.KHGSavedQuotes.districtLabel(quote.districtCode, language)} · ${root.KHGSavedQuotes.propertyLabel(quote.propertyType, language)} · ${quote.areaSqm.toLocaleString(locale)}㎡`;
      const price = doc.createElement('div');
      price.className = 'saved-home-price';
      const deposit = doc.createElement('span');
      deposit.innerHTML = `${zh ? '押金' : 'Deposit'} ${moneyHtml(quote.depositWon)}`;
      const rent = doc.createElement('span');
      rent.innerHTML = `${zh ? '月租' : 'Rent'} ${moneyHtml(quote.monthlyRentWon)}`;
      price.append(deposit, rent);
      const verdict = doc.createElement('p');
      verdict.className = `saved-home-verdict ${quote.rating}`;
      verdict.textContent = `${ratingLabel(quote.rating)} · ${confidenceLabel(quote.confidence)}`;
      const actions = doc.createElement('div');
      actions.className = 'saved-home-actions';
      const edit = doc.createElement('button');
      edit.type = 'button';
      edit.className = 'saved-home-edit';
      edit.textContent = zh ? '修改备注' : 'Edit label';
      const editForm = doc.createElement('form');
      editForm.className = 'saved-home-edit-form';
      editForm.hidden = true;
      const editInput = doc.createElement('input');
      editInput.type = 'text';
      editInput.maxLength = 60;
      editInput.autocomplete = 'off';
      editInput.value = quote.label;
      editInput.setAttribute('aria-label', zh ? '房源备注' : 'Home label');
      const editSave = doc.createElement('button');
      editSave.type = 'submit';
      editSave.textContent = zh ? '保存' : 'Save';
      const editCancel = doc.createElement('button');
      editCancel.type = 'button';
      editCancel.textContent = zh ? '取消' : 'Cancel';
      edit.addEventListener('click', () => {
        editForm.hidden = false;
        edit.hidden = true;
        editInput.focus();
      });
      editCancel.addEventListener('click', () => {
        editForm.hidden = true;
        edit.hidden = false;
      });
      editForm.addEventListener('submit', event => {
        event.preventDefault();
        if (!store.updateLabel(quote.id, editInput.value)) {
          setStatus(zh ? '无法修改备注。请检查浏览器存储设置。' : 'The label could not be updated. Check browser storage settings.', 'error');
          return;
        }
        setStatus(zh ? '房源备注已更新。' : 'Home label updated.', 'success');
        safeTrack('saved_quote_label_updated', store.list().length);
        render();
      });
      editForm.append(editInput, editSave, editCancel);
      const recheck = doc.createElement('a');
      recheck.className = 'saved-home-recheck';
      const sourcePath = zh ? '/zh/saved-homes/' : '/saved-homes/';
      const rentCheckPath = zh ? '/zh/tools/seoul-rent-check/' : '/tools/seoul-rent-check/';
      recheck.href = `${rentCheckPath}?${new URLSearchParams({ lawdCd:quote.districtCode, type:quote.propertyType, from:sourcePath })}`;
      recheck.textContent = zh ? '按原条件重新检查' : 'Recheck this quote';
      recheck.addEventListener('click', event => {
        if (!root.KHGSavedQuotes.writeRecheckPrefill(sessionStorage, quote, { from:sourcePath })) {
          event.preventDefault();
          setStatus(zh ? '当前浏览器无法安全传递报价，请重新输入。' : 'This browser could not pass the quote safely. Please enter it again.', 'error');
          return;
        }
        safeTrack('saved_quote_recheck', store.list().length);
      });
      const remove = doc.createElement('button');
      remove.type = 'button';
      remove.className = 'saved-home-remove';
      remove.textContent = zh ? '删除' : 'Remove';
      remove.addEventListener('click', () => {
        store.remove(quote.id);
        selected.delete(quote.id);
        safeTrack('saved_quote_removed', store.list().length);
        render();
      });
      actions.append(edit, recheck, remove);
      card.append(selectLabel, meta, price, verdict, actions, editForm);
      listNode.appendChild(card);
    });
    renderComparison(quotes);
  }

  async function loadFx() {
    if (!currencySelect) return;
    currencySelect.disabled = true;
    try {
      const response = await fetch('/api/fx');
      const data = await response.json();
      if (!response.ok) throw new Error('fx');
      rates = data.rates || {};
    } catch (_) {
      rates = {};
      currencySelect.value = 'KRW';
    } finally {
      currencySelect.disabled = false;
      render();
    }
  }

  if (currencySelect) currencySelect.addEventListener('change', render);
  if (clearButton) clearButton.addEventListener('click', () => {
    const confirmed = root.confirm(zh ? '删除当前浏览器中保存的全部房源？' : 'Remove every saved home from this browser?');
    if (!confirmed) return;
    store.clear();
    selected.clear();
    safeTrack('saved_quotes_cleared', 0);
    render();
  });
  root.addEventListener('khg:analytics-ready', trackOpened);
  render();
  loadFx();
  if (root.KHGAnalyticsReady === true) trackOpened();
})(typeof window !== 'undefined' ? window : null);
