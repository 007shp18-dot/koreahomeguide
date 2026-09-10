import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';

describe('Vercel project build configuration',()=>{
  it('disables automatic Git deployments for the legacy redirect project',()=>{
    const config=JSON.parse(readFileSync(fileURLToPath(new URL('../../../../vercel.json',import.meta.url)),'utf8'));
    expect(config.git?.deploymentEnabled).toBe(false);
  });

  it('uses the repository cost gate for SignedPrice builds',()=>{
    const config=JSON.parse(readFileSync(fileURLToPath(new URL('../vercel.json',import.meta.url)),'utf8'));
    expect(config.ignoreCommand).toBe('node ../../../scripts/release/ignore-build.mjs');
    expect(config.git?.deploymentEnabled).toBeUndefined();
  });

  it('runs application functions in the production database region',()=>{
    const config=JSON.parse(readFileSync(fileURLToPath(new URL('../vercel.json',import.meta.url)),'utf8'));
    expect(config.regions).toEqual(['sin1']);
  });
});
