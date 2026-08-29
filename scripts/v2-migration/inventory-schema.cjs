'use strict';

/**
 * Validate the stable, serializable shape used by the legacy route inventory.
 *
 * @param {unknown} value
 * @returns {void}
 * @throws {TypeError} when value is not a LegacyRoute
 */
function validateLegacyRoute(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Invalid LegacyRoute');
  }

  const route = /** @type {{path?: unknown, sourceFile?: unknown, kind?: unknown, locales?: unknown}} */ (value);
  if (
    typeof route.path !== 'string' ||
    !route.path.startsWith('/') ||
    !route.path.endsWith('/') ||
    typeof route.sourceFile !== 'string' ||
    !route.sourceFile.endsWith('index.html') ||
    route.sourceFile.startsWith('/') ||
    route.sourceFile.includes('\\') ||
    route.sourceFile.split('/').includes('..') ||
    typeof route.kind !== 'string' ||
    !route.kind ||
    !Array.isArray(route.locales) ||
    route.locales.length === 0 ||
    route.locales.some((locale) => typeof locale !== 'string' || !locale)
  ) {
    throw new TypeError('Invalid LegacyRoute');
  }
}

module.exports = { validateLegacyRoute };
