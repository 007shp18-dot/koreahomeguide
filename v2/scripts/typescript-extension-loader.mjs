const extensions = Object.freeze(['.ts', '.mts', '.tsx']);
const installedSnapshotRegistryUrl = new URL('../apps/web/data/installed-snapshots.json', import.meta.url).href;

export function registryJsonModule(source) {
  return `export default ${JSON.stringify(JSON.parse(source))};`;
}

export async function load(url, context, nextLoad) {
  if (url === installedSnapshotRegistryUrl) {
    const source = await (await import('node:fs/promises')).readFile(new URL(url), 'utf8');
    return { format: 'module', source: registryJsonModule(source), shortCircuit: true };
  }
  return nextLoad(url, context);
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') {
    return { url: 'data:text/javascript,export%20default%20undefined%3B', shortCircuit: true };
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (!error || typeof error !== 'object' || error.code !== 'ERR_MODULE_NOT_FOUND' ||
      (!specifier.startsWith('.') && !specifier.startsWith('file:'))) throw error;
    for (const extension of extensions) {
      try {
        return await nextResolve(`${specifier}${extension}`, context);
      } catch (candidateError) {
        if (!candidateError || typeof candidateError !== 'object' || candidateError.code !== 'ERR_MODULE_NOT_FOUND') throw candidateError;
      }
    }
    throw error;
  }
}
