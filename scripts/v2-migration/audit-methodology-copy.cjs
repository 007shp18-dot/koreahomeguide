'use strict';

const fs = require('node:fs');
const path = require('node:path');

const RELEVANT_EXTENSIONS = new Set([
  '.cjs', '.css', '.html', '.js', '.json', '.md', '.mjs', '.svg', '.txt', '.xml', '.yaml', '.yml'
]);

const SKIPPED_DIRECTORIES = new Set([
  '.git', '.next', '.superpowers', '.worktrees', 'artifacts', 'build', 'coverage', 'dist',
  'generated', 'internal', 'node_modules', 'tests', 'tmp', 'vendor'
]);

const AUDITOR_FILE = 'scripts/v2-migration/audit-methodology-copy.cjs';
const CONTRACT_DOC = 'docs/operations/signedprice-brand-contract.md';
const STATUTORY_OR_LEGAL = /\bstatutory\b|\blegal\b|法定|法律|合法/i;
const COMPARISON_RATE_CONTEXT = /\b(?:annual|comparison|conversion|deposit|monthly|reference|rent|rate)\b|比较|参考|换算|押金|月租|年率|利率/i;
const PERCENT_FIVE = /(?:^|[^\d.])5(?:\.0+)?\s*(?:%|percent)(?![\w%])|\bfive\s+percent\b|５(?:．０+)?\s*％|百分之五/i;
const RATE_ASSIGNMENT = /\b(annualRate|comparisonRate|conversionRate|fixedRate|referenceRate|rate)\b\s*[:=]\s*([^,;}\n]+)/i;
const VARIABLE_ASSIGNMENT = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/g;
const DECIMAL_FIVE = /\b0\.0*5(?:0*)\b/i;

function compareNames(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isSkippedPath(relativePath) {
  const segments = relativePath.split('/');
  return segments.slice(0, -1).some((segment) => SKIPPED_DIRECTORIES.has(segment))
    || relativePath.startsWith('docs/superpowers/')
    || relativePath === AUDITOR_FILE
    || relativePath === CONTRACT_DOC;
}

function walkFiles(rootDir, current = '') {
  const directory = path.join(rootDir, current);
  const entries = fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => compareNames(left.name, right.name));
  const files = [];
  for (const entry of entries) {
    const relativePath = current ? `${current}/${entry.name}` : entry.name;
    if (entry.isDirectory() && (SKIPPED_DIRECTORIES.has(entry.name) || relativePath === 'docs/superpowers' || relativePath.startsWith('docs/superpowers/'))) continue;
    if (isSkippedPath(relativePath)) continue;
    const absolutePath = path.join(rootDir, ...relativePath.split('/'));
    if (entry.isDirectory()) {
      files.push(...walkFiles(rootDir, relativePath));
    } else if (entry.isFile() && RELEVANT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push({ absolutePath, relativePath });
    }
  }
  return files;
}

function excerpt(line) {
  const compact = String(line).trim().replace(/\s+/g, ' ');
  return compact.length > 240 ? `${compact.slice(0, 237)}...` : compact;
}

function isFixedLiteral(value) {
  return PERCENT_FIVE.test(String(value)) || DECIMAL_FIVE.test(String(value));
}

function portableSymbol(symbol) {
  return /(?:annual|comparison|conversion|fixed|reference).*rate|rate/i.test(String(symbol))
    && String(symbol) !== 'rate';
}

function symbolPattern(symbol) {
  return new RegExp(`(^|[^A-Za-z0-9_$])${String(symbol).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9_$])`);
}

function hasSymbolReference(source, symbols) {
  return [...symbols].some((symbol) => symbolPattern(symbol).test(source));
}

function enclosingObjectName(lines, index) {
  for (let cursor = index - 1; cursor >= Math.max(0, index - 12); cursor -= 1) {
    if (!lines[cursor].trim()) break;
    const match = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:Object\.freeze\s*\(\s*)?\{/.exec(lines[cursor]);
    if (match) return match[1];
  }
  return '';
}

function fixedDefinitions(files) {
  const local = new Map(files.map((file) => [file.relativePath, new Set()]));
  const global = new Set();
  for (const file of files) {
    const symbols = local.get(file.relativePath);
    for (let index = 0; index < file.lines.length; index += 1) {
      const line = file.lines[index];
      const rateAssignment = RATE_ASSIGNMENT.exec(line);
      if (rateAssignment && isFixedLiteral(rateAssignment[2])) {
        const key = rateAssignment[1];
        symbols.add(key);
        const object = enclosingObjectName(file.lines, index);
        if (object) {
          const dotted = `${object}.${key}`;
          symbols.add(dotted);
          global.add(dotted);
        }
      }
      VARIABLE_ASSIGNMENT.lastIndex = 0;
      let variable;
      while ((variable = VARIABLE_ASSIGNMENT.exec(line))) {
        if (portableSymbol(variable[1]) && isFixedLiteral(variable[2])) {
          symbols.add(variable[1]);
          global.add(variable[1]);
        }
      }
    }
  }
  return { global, local };
}

function assignmentPairs(line) {
  const pairs = [];
  VARIABLE_ASSIGNMENT.lastIndex = 0;
  let match;
  while ((match = VARIABLE_ASSIGNMENT.exec(line))) pairs.push({ name: match[1], expression: match[2] });
  return pairs;
}

function propagateSymbols(files, definitions) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const file of files) {
      const symbols = definitions.local.get(file.relativePath);
      for (const line of file.lines) {
        for (const pair of assignmentPairs(line)) {
          if (symbols.has(pair.name) || hasSymbolReference(pair.expression, symbols) || hasSymbolReference(pair.expression, definitions.global)) {
            if (!symbols.has(pair.name)) {
              symbols.add(pair.name);
              changed = true;
            }
            if (portableSymbol(pair.name) && !definitions.global.has(pair.name)) {
              definitions.global.add(pair.name);
              changed = true;
            }
          }
        }
      }
    }
  }
}

function fixedLiteralOnLine(line) {
  if (PERCENT_FIVE.test(line)) return true;
  const assignment = RATE_ASSIGNMENT.exec(line);
  return Boolean(assignment && isFixedLiteral(assignment[2]) && DECIMAL_FIVE.test(assignment[2]));
}

function hasFixedFivePercent(lines, index, start, end) {
  for (let candidate = start; candidate <= end; candidate += 1) {
    if (Math.abs(candidate - index) > 6) continue;
    const between = lines.slice(Math.min(index, candidate), Math.max(index, candidate) + 1);
    if (between.some((line) => !line.trim())) continue;
    if (fixedLiteralOnLine(lines[candidate])) return true;
  }
  return false;
}

/**
 * Find fixed five-percent conversion claims labelled statutory or legal.
 * This function only reads source files; it does not alter the scanned tree.
 *
 * @param {string} rootDir
 * @returns {Array<{file:string,line:number,code:string,excerpt:string}>}
 */
function auditMethodologyCopy(rootDir) {
  if (typeof rootDir !== 'string' || !rootDir) throw new TypeError('rootDir must be a non-empty string');
  const resolvedRoot = path.resolve(rootDir);
  const files = walkFiles(resolvedRoot).map((file) => ({
    ...file,
    lines: fs.readFileSync(file.absolutePath, 'utf8').split(/\r?\n/)
  }));
  const definitions = fixedDefinitions(files);
  propagateSymbols(files, definitions);
  const findings = [];
  for (const file of files) {
    const lines = file.lines;
    let lastFindingLine = -Infinity;
    for (let index = 0; index < lines.length; index += 1) {
      if (!STATUTORY_OR_LEGAL.test(lines[index])) continue;
      const start = Math.max(0, index - 6);
      const end = Math.min(lines.length - 1, index + 6);
      const context = lines.slice(start, end + 1).join('\n');
      const hasProvenRate = hasSymbolReference(lines[index], definitions.local.get(file.relativePath))
        || hasSymbolReference(lines[index], definitions.global);
      if (!COMPARISON_RATE_CONTEXT.test(context)
        || (!hasFixedFivePercent(lines, index, start, end) && !hasProvenRate)
        || index - lastFindingLine <= 6) continue;
      findings.push({
        file: file.relativePath,
        line: index + 1,
        code: 'fixed_rate_called_statutory',
        excerpt: excerpt(lines[index])
      });
      lastFindingLine = index;
    }
  }
  return findings.sort((left, right) => compareNames(left.file, right.file) || left.line - right.line || compareNames(left.code, right.code));
}

function writeJson(outputFile, value) {
  const outputPath = path.resolve(outputFile);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

if (require.main === module) {
  const writeIndex = process.argv.indexOf('--write');
  if (writeIndex === -1 || !process.argv[writeIndex + 1]) {
    process.stdout.write(`${JSON.stringify(auditMethodologyCopy(process.cwd()), null, 2)}\n`);
  } else {
    writeJson(process.argv[writeIndex + 1], auditMethodologyCopy(process.cwd()));
  }
}

module.exports = { auditMethodologyCopy, walkFiles };
