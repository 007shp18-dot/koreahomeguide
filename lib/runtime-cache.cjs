'use strict';

let functionsModulePromise = null;

async function loadFunctionsModule() {
  if (!functionsModulePromise) {
    functionsModulePromise = import('@vercel/functions').catch(() => null);
  }
  return functionsModulePromise;
}

async function getRuntimeCache({ env = process.env, moduleLoader = loadFunctionsModule } = {}) {
  if (!env.VERCEL) return null;
  try {
    const mod = await moduleLoader();
    const getCache = mod && (mod.getCache || (mod.default && mod.default.getCache));
    if (typeof getCache !== 'function') return null;
    return getCache({ namespace:'khg-molit-v11-3' });
  } catch (_) {
    functionsModulePromise = null;
    return null;
  }
}

module.exports = { getRuntimeCache };
