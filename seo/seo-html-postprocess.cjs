'use strict';

function normalizeGuideHubLinks(html, lang = 'en') {
  const source = String(html || '');
  if (String(lang || '').toLowerCase().startsWith('zh')) {
    return source.replace(/href="\/zh\/guides\/wolse-vs-jeonse\/"/g, 'href="/zh/guides/"');
  }
  return source.replace(/href="\/guides\/wolse-vs-jeonse\/"/g, 'href="/guides/"');
}

module.exports = { normalizeGuideHubLinks };
