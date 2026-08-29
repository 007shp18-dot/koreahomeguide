'use strict';

const fs = require('node:fs');
const path = require('node:path');

function buildBrandContract() {
  return Object.freeze({
    brand: 'signedprice',
    domain: 'signedprice.com',
    casing: 'lowercase-public',
    colors: Object.freeze({
      ink: '#0f172a',
      white: '#ffffff',
      accent: '#2563eb',
      accentLight: '#60a5fa',
      muted: '#64748b'
    }),
    descriptors: Object.freeze([
      'Real prices. Local rules. Trusted experts.',
      'Global property intelligence and transaction network.'
    ]),
    logoAssets: Object.freeze([
      'logo-mark.svg',
      'logo-mark-16.svg',
      'logo-mark-inverse.svg',
      'logo-mark-mono.svg',
      'favicon.svg',
      'favicon.ico',
      'apple-touch-icon.png',
      'og-image.svg'
    ]),
    ogRules: Object.freeze({
      defaultClaim: 'Property intelligence for Seoul, Singapore and Dubai',
      requireMarketCapabilityEvidence: true
    })
  });
}

function writeJson(outputFile, value) {
  const outputPath = path.resolve(outputFile);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

if (require.main === module) {
  const writeIndex = process.argv.indexOf('--write');
  if (writeIndex === -1 || !process.argv[writeIndex + 1]) {
    process.stdout.write(`${JSON.stringify(buildBrandContract(), null, 2)}\n`);
  } else {
    writeJson(process.argv[writeIndex + 1], buildBrandContract());
  }
}

module.exports = { buildBrandContract, writeJson };
