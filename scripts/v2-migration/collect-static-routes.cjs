'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { validateLegacyRoute } = require('./inventory-schema.cjs');

const EXCLUDED_DIRECTORY_NAMES = new Set([
  '.git',
  '.superpowers',
  '.worktrees',
  'artifacts',
  'node_modules',
  'tests',
  'worktrees',
]);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function walkHtml(rootDir) {
  const files = [];

  function visit(directory, relativeDirectory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      if (entry.isDirectory() && !EXCLUDED_DIRECTORY_NAMES.has(entry.name)) {
        visit(
          path.join(directory, entry.name),
          relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name,
        );
      } else if (entry.isFile() && entry.name === 'index.html') {
        files.push(relativeDirectory ? `${relativeDirectory}/index.html` : entry.name);
      }
    }
  }

  visit(rootDir, '');
  return files.map(toPosix);
}

function routePath(sourceFile) {
  const withoutIndex = sourceFile === 'index.html'
    ? ''
    : sourceFile.slice(0, -'index.html'.length);
  return `/${withoutIndex}`.replace(/\/+/g, '/');
}

function routeKind(route) {
  const segments = route.split('/').filter(Boolean);
  const first = segments[0] === 'zh' ? segments[1] : segments[0];
  const kinds = {
    community: 'community',
    compare: 'compare',
    explore: 'explore',
    guides: 'guide',
    rent: 'rent',
    tools: 'tool',
  };
  return kinds[first] || 'page';
}

function localeFor(sourceFile) {
  if (sourceFile === 'zh/index.html' || sourceFile.startsWith('zh/')) {
    return 'zh-CN';
  }
  return 'en';
}

function toLegacyRoute(sourceFile) {
  const route = {
    path: routePath(sourceFile),
    sourceFile,
    kind: routeKind(routePath(sourceFile)),
    locales: [localeFor(sourceFile)],
  };
  validateLegacyRoute(route);
  return route;
}

/**
 * Collect every public static route represented by an index.html file.
 * Paths are relative to rootDir and sorted by public URL for reproducibility.
 *
 * @param {string} rootDir
 * @returns {Array<{path: string, sourceFile: string, kind: string, locales: string[]}>}
 */
function collectStaticRoutes(rootDir) {
  if (typeof rootDir !== 'string' || !rootDir) {
    throw new TypeError('rootDir must be a non-empty string');
  }

  const resolvedRoot = path.resolve(rootDir);
  const routes = walkHtml(resolvedRoot)
    .filter((file) => file.endsWith('/index.html') || file === 'index.html')
    .map(toLegacyRoute)
    .sort((a, b) => a.path.localeCompare(b.path));
  return routes;
}

function writeInventory(outputFile, routes) {
  const outputPath = path.resolve(outputFile);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(routes, null, 2)}\n`, 'utf8');
}

if (require.main === module) {
  const writeIndex = process.argv.indexOf('--write');
  if (writeIndex === -1 || !process.argv[writeIndex + 1]) {
    console.error('Usage: node scripts/v2-migration/collect-static-routes.cjs --write <output.json>');
    process.exitCode = 1;
  } else {
    writeInventory(process.argv[writeIndex + 1], collectStaticRoutes(process.cwd()));
  }
}

module.exports = { collectStaticRoutes, walkHtml };
