(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KHGResultShareCard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  function escapeXml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' })[char]);
  }

  function safeModel(input) {
    return {
      verdict:String(input && input.verdict || 'Not enough comparable data').slice(0, 80),
      evidence:String(input && input.evidence || 'Not rated').slice(0, 40),
      comparableCount:String(Math.max(0, Number(input && input.comparableCount) || 0)),
      nextAction:String(input && input.nextAction || '').slice(0, 180)
    };
  }

  function wrapText(value, width = 46, maxLines = 3) {
    const words = String(value || '').trim().split(/\s+/).filter(Boolean);
    const lines = [];
    while (words.length && lines.length < maxLines) {
      let line = words.shift();
      while (words.length && `${line} ${words[0]}`.length <= width) line += ` ${words.shift()}`;
      lines.push(line);
    }
    if (words.length && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.…]*$/, '')}…`;
    return lines;
  }

  function createCardSvg(input, language = 'en') {
    const model = safeModel(input);
    const zh = language === 'zh-CN';
    const lines = wrapText(model.nextAction, zh ? 24 : 46, 3);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="KoreaHomeGuide rent check result">
      <rect width="1200" height="630" fill="#f7f9fc"/>
      <rect x="70" y="58" width="1060" height="514" rx="28" fill="#ffffff" stroke="#d9e1ec" stroke-width="2"/>
      <rect x="70" y="58" width="12" height="514" rx="6" fill="#2463eb"/>
      <text x="118" y="122" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#2463eb">KOREAHOMEGUIDE · ${zh ? '首尔租金检查' : 'SEOUL RENT CHECK'}</text>
      <text x="118" y="222" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#152033">${escapeXml(model.verdict)}</text>
      <text x="118" y="282" font-family="Arial, sans-serif" font-size="25" fill="#5c687a">${escapeXml(zh ? '依据等级' : 'Evidence')} · ${escapeXml(model.evidence)}</text>
      <line x1="118" y1="324" x2="1080" y2="324" stroke="#d9e1ec" stroke-width="2"/>
      <text x="118" y="382" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#152033">${escapeXml(model.comparableCount)} ${escapeXml(zh ? '笔官方已签约成交' : 'official signed contracts')}</text>
      ${lines.map((line, index) => `<text x="118" y="${448 + index * 37}" font-family="Arial, sans-serif" font-size="25" fill="#5c687a">${escapeXml(line)}</text>`).join('')}
      <text x="1082" y="530" text-anchor="end" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#2463eb">koreahomeguide.com</text>
    </svg>`;
  }

  async function downloadCard(input, options = {}) {
    if (typeof document === 'undefined') throw new Error('Card download requires a browser.');
    const svg = createCardSvg(input, options.language || 'en');
    const blob = new Blob([svg], { type:'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = options.filename || 'koreahomeguide-rent-check.svg';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return anchor.download;
  }

  return Object.freeze({ safeModel, createCardSvg, downloadCard });
});
