import {describe,it,expect} from 'vitest';
// @ts-expect-error JS release script is shared with Vercel's ignored build command.
import {shouldBuild} from '../../scripts/release/ignore-build.mjs';
describe('release build policy',()=>{
 it('holds routine pushes and builds an explicitly requested release',()=>{
  expect(shouldBuild({environment:'production',message:'fix a card',files:['v2/apps/web/app/page.tsx']})).toBe(false);
  expect(shouldBuild({environment:'production',message:'[release] batch',files:['v2/apps/web/app/page.tsx']})).toBe(true);
 });
 it('does not rebuild for test-only or docs-only releases',()=>{
  expect(shouldBuild({environment:'production',message:'[release] docs',files:['docs/operations.md','v2/apps/web/test/foo.test.ts']})).toBe(false);
 });
 it('keeps preview requests separate and builds releases with missing baseline history',()=>{
  expect(shouldBuild({environment:'preview',message:'[release] batch',files:null})).toBe(false);
  expect(shouldBuild({environment:'preview',message:'[preview] review',files:null})).toBe(true);
  expect(shouldBuild({environment:'production',message:'[release] bootstrap',files:null})).toBe(true);
 });
});
