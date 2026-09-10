import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';

describe('Vercel project build configuration',()=>{
  it.each(['../../../../vercel.json','../vercel.json'])(
    '%s does not configure build exclusions',
    relativePath=>{
      const config=JSON.parse(readFileSync(fileURLToPath(new URL(relativePath,import.meta.url)),'utf8'));
      expect(config.ignoreCommand).toBeUndefined();
      expect(config.git?.deploymentEnabled).toBeUndefined();
    },
  );
});
