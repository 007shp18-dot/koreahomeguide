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
  const mobileSelectionLimit = root.KHGSavedQuotes.comparisonSelectionLimit(true);
  const desktopSelectionLimit = root.KHGSavedQuotes.comparisonSelectionLimit(false);
  const mobileQuery = typeof root.matchMedia === 'function' ? root.matchMedia('(max-width: 760px)') : null;
  const reduceMotionQuery = typeof root.matchMedia === 'function' ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
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

  function missingFeeOutput(quote) {
    return { missingFee:true, quoteId:quote.id, text:zh ? '未填写' : 'Not added' };
  }

  function appendComparisonValue(node, output) {
    if (output && typeof output === 'object' && Object.hasOwn(output, 'money')) {
      node.innerHTML = moneyHtml(output.money);
      return;
    }
    if (output && output.missingFee) {
      const text = doc.createElement('span');
      text.textContent = output.text;
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'saved-home-add-fee';
      button.setAttribute('data-add-fee-for', output.quoteId);
      button.textContent = zh ? '填写管理费后比较' : 'Add fee to compare';
      node.append(text, button);
      return;
    }
    node.textContent = output;
  }

  function comparisonCell(output) {
    const cell = doc.createElement('td');
    appendComparisonValue(cell, output);
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

  function selectionLimit() {
    return mobileQuery && mobileQuery.matches ? mobileSelectionLimit : desktopSelectionLimit;
  }

  function fixedCost(quote) {
    return root.KHGSavedQuotes.fixedMonthlyCostWon(quote);
  }

  function checklistText(quote) {
    const progress = root.KHGSavedQuotes.checklistProgress(quote);
    return zh ? `${progress.completed}/${progress.total} 项已确认` : `${progress.completed}/${progress.total} checked`;
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
      [zh ? '私人备注' : 'Private note', quote => quote.note || '—'],
      [zh ? '看房状态' : 'Visit status', quote => quote.isVisited ? (zh ? '已看房' : 'Visited') : (zh ? '未标记为已看房' : 'Not marked visited')],
      [zh ? '签约候选' : 'Contract candidate', quote => quote.isContractCandidate ? (zh ? '是' : 'Yes') : (zh ? '否' : 'No')],
      [zh ? '签约前检查' : 'Contract checks', quote => checklistText(quote)],
      [zh ? '押金' : 'Deposit', quote => ({ money:quote.depositWon })],
      [zh ? '月租' : 'Monthly rent', quote => ({ money:quote.monthlyRentWon })],
      [zh ? '固定管理费' : 'Fixed management fee', quote => quote.managementFeeWon == null ? missingFeeOutput(quote) : ({ money:quote.managementFeeWon })],
      [zh ? '每月固定支出' : 'Known monthly total', quote => fixedCost(quote) == null ? missingFeeOutput(quote) : ({ money:fixedCost(quote) })],
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
    const lowestCost = root.KHGSavedQuotes.lowestKnownMonthlyCost(chosen);
    chosen.forEach(quote => {
      const card = doc.createElement('article');
      if (lowestCost != null && fixedCost(quote) === lowestCost) card.classList.add('saved-home-lowest-cost');
      if (quote.isContractCandidate) card.classList.add('is-contract-candidate');
      const heading = doc.createElement('h3');
      heading.textContent = `${quote.isContractCandidate ? '◆ ' : ''}${quote.isFavorite ? '★ ' : ''}${displayName(quote)}`;
      card.appendChild(heading);
      if (lowestCost != null && fixedCost(quote) === lowestCost) {
        const badge = doc.createElement('p');
        badge.className = 'saved-home-lowest-badge';
        badge.textContent = zh ? '所选房源中每月固定支出最低' : 'Lowest known monthly total selected';
        card.appendChild(badge);
      }
      rows.forEach(([label, valueFor]) => {
        const item = doc.createElement('div');
        const name = doc.createElement('span');
        const value = doc.createElement('strong');
        name.textContent = label;
        const output = valueFor(quote);
        appendComparisonValue(value, output);
        item.append(name, value);
        card.appendChild(item);
      });
      cards.appendChild(card);
    });
    return cards;
  }

  function renderComparison(quotes) {
    compareNode.textContent = '';
    const limit = selectionLimit();
    const chosen = quotes.filter(quote => selected.has(quote.id)).slice(0, limit);
    if (!chosen.length) {
      const message = doc.createElement('p');
      message.className = 'saved-homes-select-note';
      message.textContent = zh
        ? `选择1至${limit}个房源进行并排比较。`
        : `Select one to ${limit} homes for a side-by-side comparison.`;
      compareNode.appendChild(message);
      return;
    }

    const completeness = root.KHGSavedQuotes.comparisonCompleteness(chosen);
    if (completeness.missing > 0) {
      const completenessNote = doc.createElement('p');
      completenessNote.className = 'saved-homes-completeness-note';
      completenessNote.textContent = zh
        ? `所选 ${completeness.selected} 个房源中有 ${completeness.missing} 个尚未填写固定管理费。补充后才能准确比较每月固定支出。`
        : `${completeness.missing} of ${completeness.selected} selected homes ${completeness.missing === 1 ? 'is' : 'are'} missing a fixed management fee. Add it to compare known monthly totals accurately.`;
      compareNode.appendChild(completenessNote);
    }

    const tableWrap = doc.createElement('div');
    tableWrap.className = 'saved-homes-table-wrap';
    const table = doc.createElement('table');
    table.className = 'saved-homes-table';
    const head = doc.createElement('thead');
    const headRow = doc.createElement('tr');
    headRow.appendChild(textCell(zh ? '比较项目' : 'Compare', 'th'));
    const lowestCost = root.KHGSavedQuotes.lowestKnownMonthlyCost(chosen);
    chosen.forEach(quote => {
      const heading = textCell(`${quote.isContractCandidate ? '◆ ' : ''}${quote.isFavorite ? '★ ' : ''}${displayName(quote)}`, 'th');
      if (lowestCost != null && fixedCost(quote) === lowestCost) {
        const badge = doc.createElement('span');
        badge.className = 'saved-home-table-lowest-badge';
        badge.textContent = zh ? '所选房源中每月固定支出最低' : 'Lowest known monthly total selected';
        heading.appendChild(badge);
      }
      headRow.appendChild(heading);
    });
    head.appendChild(headRow);
    table.appendChild(head);
    const body = doc.createElement('tbody');
    const rows = comparisonRows();
    rows.forEach(([label, valueFor]) => {
      const row = doc.createElement('tr');
      row.appendChild(textCell(label, 'th'));
      chosen.forEach(quote => {
        const value = valueFor(quote);
        row.appendChild(comparisonCell(value));
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
      ? '每月固定支出只计算月租加固定管理费，不包含按用量计费的水电、网络、停车、楼层、装修、通勤或押金安全。'
      : 'Known monthly total means monthly rent plus fixed management fee. It excludes usage-based utilities, internet, parking, floor, condition, commute, and deposit safety.';
    compareNode.appendChild(note);
    const signature = chosen.map(quote => quote.id).sort().join('|');
    if (signature !== comparedSignature) {
      safeTrack('saved_quotes_compared', chosen.length);
      comparedSignature = signature;
    }
  }

  function render() {
    const quotes = root.KHGSavedQuotes.sortForComparison(store.list());
    const limit = selectionLimit();
    if (!selected.size) quotes.slice(0, Math.min(limit, quotes.length)).forEach(quote => selected.add(quote.id));
    selected = new Set([...selected].filter(id => quotes.some(quote => quote.id === id)).slice(0, limit));
    listNode.textContent = '';
    countNode.textContent = zh ? `当前浏览器中保存了 ${quotes.length} 个房源` : `${quotes.length} saved home${quotes.length === 1 ? '' : 's'} in this browser`;
    emptyNode.hidden = quotes.length > 0;
    clearButton.hidden = quotes.length === 0;

    quotes.forEach(quote => {
      const card = doc.createElement('article');
      card.className = `saved-home-card${quote.isFavorite ? ' is-favorite' : ''}${quote.isContractCandidate ? ' is-contract-candidate' : ''}`;
      const favorite = doc.createElement('button');
      favorite.type = 'button';
      favorite.className = 'saved-home-favorite';
      favorite.setAttribute('aria-pressed', quote.isFavorite ? 'true' : 'false');
      favorite.setAttribute('aria-label', zh ? `${displayName(quote)} 收藏` : `Favorite ${displayName(quote)}`);
      favorite.textContent = quote.isFavorite ? '★' : '☆';
      favorite.addEventListener('click', () => {
        const updated = store.updateComparisonDetails(quote.id, {
          managementFeeWon:quote.managementFeeWon,
          isFavorite:!quote.isFavorite
        });
        if (!updated) {
          setStatus(zh ? '无法更新收藏。请检查浏览器存储设置。' : 'The favorite could not be updated. Check browser storage settings.', 'error');
          return;
        }
        safeTrack('saved_quote_favorite_toggled', store.list().length);
        render();
      });
      const selectLabel = doc.createElement('label');
      selectLabel.className = 'saved-home-select';
      const checkbox = doc.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selected.has(quote.id);
      checkbox.setAttribute('aria-label', zh ? `比较 ${displayName(quote)}` : `Compare ${displayName(quote)}`);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked && selected.size >= selectionLimit()) {
          checkbox.checked = false;
          setStatus(zh ? `当前屏幕最多可比较${selectionLimit()}个房源。` : `You can compare up to ${selectionLimit()} homes on this screen.`);
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
      const decisionBadges = doc.createElement('div');
      decisionBadges.className = 'saved-home-decision-badges';
      if (quote.isContractCandidate) {
        const candidateBadge = doc.createElement('span');
        candidateBadge.className = 'is-candidate';
        candidateBadge.textContent = zh ? '签约候选' : 'Contract candidate';
        decisionBadges.appendChild(candidateBadge);
      }
      if (quote.isVisited) {
        const visitedBadge = doc.createElement('span');
        visitedBadge.textContent = zh ? '已看房' : 'Visited';
        decisionBadges.appendChild(visitedBadge);
      }
      const progressBadge = doc.createElement('span');
      progressBadge.textContent = checklistText(quote);
      decisionBadges.appendChild(progressBadge);
      const price = doc.createElement('div');
      price.className = 'saved-home-price';
      const deposit = doc.createElement('span');
      deposit.innerHTML = `${zh ? '押金' : 'Deposit'} ${moneyHtml(quote.depositWon)}`;
      const rent = doc.createElement('span');
      rent.innerHTML = `${zh ? '月租' : 'Rent'} ${moneyHtml(quote.monthlyRentWon)}`;
      const fee = doc.createElement('span');
      fee.innerHTML = `${zh ? '固定管理费' : 'Fixed fee'} ${quote.managementFeeWon == null ? (zh ? '未填写' : 'Not added') : moneyHtml(quote.managementFeeWon)}`;
      const total = doc.createElement('span');
      total.className = 'saved-home-total';
      total.innerHTML = `${zh ? '每月固定支出' : 'Known monthly total'} ${fixedCost(quote) == null ? '—' : moneyHtml(fixedCost(quote))}`;
      price.append(deposit, rent, fee, total);
      const costForm = doc.createElement('form');
      costForm.className = 'saved-home-cost-editor';
      const costLabel = doc.createElement('label');
      const costLabelText = doc.createElement('span');
      costLabelText.textContent = zh ? '固定管理费（韩元/月）' : 'Fixed management fee (KRW/month)';
      const costInput = doc.createElement('input');
      costInput.type = 'number';
      costInput.inputMode = 'numeric';
      costInput.min = '0';
      costInput.max = '100000000';
      costInput.step = '1000';
      costInput.value = quote.managementFeeWon == null ? '' : String(quote.managementFeeWon);
      costInput.placeholder = zh ? '不知道可留空' : 'Leave blank if unknown';
      costInput.setAttribute('data-fee-input-for', quote.id);
      costLabel.append(costLabelText, costInput);
      const costSave = doc.createElement('button');
      costSave.type = 'submit';
      costSave.textContent = zh ? '更新月支出' : 'Update monthly cost';
      costForm.append(costLabel, costSave);
      costForm.addEventListener('submit', event => {
        event.preventDefault();
        const parsedFee = root.KHGSavedQuotes.parseManagementFeeWon(costInput.value);
        if (!parsedFee.valid) {
          setStatus(zh ? '请输入0至1亿韩元之间的管理费，或留空。' : 'Enter a management fee from KRW 0 to 100,000,000, or leave it blank.', 'error');
          return;
        }
        if (!store.updateComparisonDetails(quote.id, { managementFeeWon:parsedFee.value, isFavorite:quote.isFavorite })) {
          setStatus(zh ? '无法更新管理费。请检查浏览器存储设置。' : 'The management fee could not be updated. Check browser storage settings.', 'error');
          return;
        }
        setStatus(zh ? '每月固定支出已更新。' : 'Known monthly total updated.', 'success');
        safeTrack('saved_quote_management_fee_updated', store.list().length);
        render();
      });
      const decisionDetails = doc.createElement('details');
      decisionDetails.className = 'saved-home-decision';
      const decisionSummary = doc.createElement('summary');
      decisionSummary.textContent = zh ? '决策备注与签约前检查' : 'Decision notes & checks';
      const decisionForm = doc.createElement('form');
      decisionForm.className = 'saved-home-decision-editor';
      const noteLabel = doc.createElement('label');
      noteLabel.className = 'saved-home-note-field';
      const noteText = doc.createElement('span');
      noteText.textContent = zh ? '私人备注（最多240个字符）' : 'Private note (up to 240 characters)';
      const noteInput = doc.createElement('textarea');
      noteInput.maxLength = 240;
      noteInput.rows = 3;
      noteInput.value = quote.note;
      noteInput.placeholder = zh ? '例如：采光好，确认停车费' : 'For example: Good light; confirm parking fee';
      noteLabel.append(noteText, noteInput);
      const decisionFlags = doc.createElement('div');
      decisionFlags.className = 'saved-home-decision-flags';
      const visitedLabel = doc.createElement('label');
      const visitedInput = doc.createElement('input');
      visitedInput.type = 'checkbox';
      visitedInput.checked = quote.isVisited;
      visitedLabel.append(visitedInput, doc.createTextNode(zh ? ' 已看房' : ' Visited'));
      const candidateLabel = doc.createElement('label');
      const candidateInput = doc.createElement('input');
      candidateInput.type = 'checkbox';
      candidateInput.checked = quote.isContractCandidate;
      candidateLabel.append(candidateInput, doc.createTextNode(zh ? ' 标记为签约候选' : ' Mark as contract candidate'));
      decisionFlags.append(visitedLabel, candidateLabel);
      const checklistFieldset = doc.createElement('fieldset');
      checklistFieldset.className = 'saved-home-checklist';
      const checklistLegend = doc.createElement('legend');
      checklistLegend.textContent = zh ? '签约前确认项' : 'Before-contract checks';
      checklistFieldset.appendChild(checklistLegend);
      const checklistLabels = {
        registryOwner:zh ? '已核对登记簿与出租人/所有人' : 'Registry and owner checked',
        depositProtection:zh ? '已确认押金保护条件' : 'Deposit-protection eligibility checked',
        managementFeeBreakdown:zh ? '已确认管理费明细' : 'Management-fee breakdown checked',
        contractTerms:zh ? '已理解合同条款' : 'Contract terms understood'
      };
      const checklistInputs = new Map();
      root.KHGSavedQuotes.CHECKLIST_KEYS.forEach(key => {
        const label = doc.createElement('label');
        const input = doc.createElement('input');
        input.type = 'checkbox';
        input.checked = quote.checklist[key] === true;
        label.append(input, doc.createTextNode(` ${checklistLabels[key]}`));
        checklistInputs.set(key, input);
        checklistFieldset.appendChild(label);
      });
      const checklistNotice = doc.createElement('p');
      checklistNotice.textContent = zh
        ? '仅记录你已完成的确认项，不代表法律核验或风险评分。'
        : 'Tracks only what you checked. It is not legal verification or a risk score.';
      const decisionSave = doc.createElement('button');
      decisionSave.type = 'submit';
      decisionSave.className = 'saved-home-decision-save';
      decisionSave.textContent = zh ? '保存决策信息' : 'Save decision details';
      decisionForm.append(noteLabel, decisionFlags, checklistFieldset, checklistNotice, decisionSave);
      decisionForm.addEventListener('submit', event => {
        event.preventDefault();
        const checklist = {};
        checklistInputs.forEach((input, key) => { checklist[key] = input.checked; });
        const updated = store.updateDecisionDetails(quote.id, {
          note:noteInput.value,
          isVisited:visitedInput.checked,
          isContractCandidate:candidateInput.checked,
          checklist
        });
        if (!updated) {
          setStatus(zh ? '无法保存决策信息。请检查浏览器存储设置。' : 'Decision details could not be saved. Check browser storage settings.', 'error');
          return;
        }
        setStatus(zh ? '决策信息已保存在当前浏览器。' : 'Decision details saved in this browser.', 'success');
        safeTrack('saved_quote_decision_updated', store.list().length);
        render();
      });
      decisionDetails.append(decisionSummary, decisionForm);
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
      recheck.textContent = zh ? '按原条件再次运行租金检查' : 'Run Rent Check again';
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
      card.append(favorite, selectLabel, meta, decisionBadges, price, costForm, decisionDetails, verdict, actions, editForm);
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
  if (compareNode) compareNode.addEventListener('click', event => {
    const button = event.target && typeof event.target.closest === 'function'
      ? event.target.closest('[data-add-fee-for]')
      : null;
    if (!button) return;
    const quoteId = button.getAttribute('data-add-fee-for');
    const input = [...doc.querySelectorAll('[data-fee-input-for]')]
      .find(candidate => candidate.getAttribute('data-fee-input-for') === quoteId);
    if (!input) {
      setStatus(zh ? '找不到对应房源的管理费输入框。' : 'The management-fee editor for this home is unavailable.', 'error');
      return;
    }
    if (typeof input.getBoundingClientRect === 'function') {
      const rect = input.getBoundingClientRect();
      const viewportHeight = Number(root.innerHeight || doc.documentElement.clientHeight || 0);
      if (rect.top < 0 || (viewportHeight && rect.bottom > viewportHeight)) {
        input.scrollIntoView({ behavior:reduceMotionQuery && reduceMotionQuery.matches ? 'auto' : 'smooth', block:'center' });
      }
    }
    input.focus();
  });
  if (mobileQuery && typeof mobileQuery.addEventListener === 'function') mobileQuery.addEventListener('change', render);
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
