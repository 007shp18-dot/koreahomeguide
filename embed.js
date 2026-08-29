(function() {
  'use strict';
  const scripts = [...document.querySelectorAll('script[data-khg-rent-snapshot]')];
  scripts.forEach(script => {
    const params = new URLSearchParams({ lawdCd:script.dataset.lawdCd || '11680', type:script.dataset.type || 'apartment' });
    const frame = document.createElement('iframe');
    frame.src = `https://koreahomeguide.com/embed/?${params}`;
    frame.title = script.dataset.title || 'KoreaHomeGuide Seoul rent market snapshot';
    frame.loading = 'lazy'; frame.style.width = '100%'; frame.style.height = '330px'; frame.style.border = '0';
    frame.dataset.khgRentSnapshotFrame = '';
    script.insertAdjacentElement('afterend', frame);
  });
  window.addEventListener('message', message => {
    if (message.origin !== 'https://koreahomeguide.com' || !message.data || message.data.type !== 'khg:embed-height') return;
    const frame = [...document.querySelectorAll('iframe[data-khg-rent-snapshot-frame]')].find(item => item.contentWindow === message.source);
    if (frame) frame.style.height = `${Math.max(240, Math.min(800, Number(message.data.height) || 330))}px`;
  });
})();
