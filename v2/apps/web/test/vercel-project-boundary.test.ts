import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';

describe('Vercel project build configuration',()=>{
  it.each(['../../../../vercel.json','../vercel.json'])(
    '%s does not configure build exclusions',
    relativePath=>{
      const config=JSON.parse(readFileSync(fileURLToPath(new URL(relativePath,import.meta.url)),'utf8'));
      // Explicit continue overrides a stale project-level Ignored Build Step.
      expect(config.ignoreCommand).toBe(relativePath==='../vercel.json'?'exit 1':undefined);
      expect(config.git?.deploymentEnabled).toBeUndefined();
    },
  );

  it('runs application functions in the production database region',()=>{
    const config=JSON.parse(readFileSync(fileURLToPath(new URL('../vercel.json',import.meta.url)),'utf8'));
    expect(config.regions).toEqual(['sin1']);
  });
});
