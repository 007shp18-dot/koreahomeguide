'use strict';

let functionsModulePromise = null;

async function loadFunctionsModule() {
  if (!functionsModulePromise) {
    functionsModulePromise = import('@vercel/functions').catch(() => null);
  }
  return functionsModulePromise;
}

async function getRuntimeCache() {
  if (!process.env.VERCEL) return null;
  try {
    const mod = await loadFunctionsModule();
    const getCache = mod && (mod.getCache || (mod.default && mod.default.getCache));
    if (typeof getCache !== 'function') return null;
    return getCache(undefined, 'khg-molit-v11-3');
  } catch (_) {
    functionsModulePromise = null;
    return null;
  }
}

module.exports = { getRuntimeCache };
