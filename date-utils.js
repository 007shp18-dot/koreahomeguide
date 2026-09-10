(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.KHGDate = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function parts(value, requireDay) {
    const source = String(value || '').trim();
    const match = source.match(requireDay ? /^(\d{4})-(\d{2})-(\d{2})$/ : /^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = match[3] == null ? null : Number(match[3]);
    if (!Number.isInteger(year) || month < 1 || month > 12) return null;
    if (requireDay && (!Number.isInteger(day) || day < 1 || day > 31)) return null;
    return { year, month, day };
  }

  function isChinese(locale) {
    return String(locale || '').toLowerCase().startsWith('zh');
  }

  function formatDate(value, locale) {
    const p = parts(value, true);
    if (!p) return '—';
    if (isChinese(locale)) return `${p.year}年${p.month}月${p.day}日`;
    return `${EN_MONTHS[p.month - 1]} ${p.day}, ${p.year}`;
  }

  function formatMonth(value, locale) {
    const p = parts(value, false);
    if (!p) return '—';
    if (isChinese(locale)) return `${p.year}年${p.month}月`;
    return `${EN_MONTHS[p.month - 1]} ${p.year}`;
  }

  return { formatDate, formatMonth };
});
