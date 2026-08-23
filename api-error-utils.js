(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KHGApiErrors = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function humanizePriceError(message, type) {
    const text = String(message || '').trim();
    if (/HTTP\s*403|forbidden|not authorized|access denied/i.test(text)) {
      const label = type === 'apartment'
        ? 'Apartment'
        : type === 'villa'
          ? 'Villa / multi-family'
          : 'This';
      return `${label} transaction data is not available yet. Officetel data is available now.`;
    }
    return text || 'Could not load official transaction data. Please try again.';
  }

  return { humanizePriceError };
});
