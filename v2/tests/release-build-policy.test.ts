import {describe,it,expect} from 'vitest';
// @ts-expect-error JS release script is shared with Vercel's ignored build command.
import {shouldBuild} from '../../scripts/release/ignore-build.mjs';
describe('release build policy',()=>{
 it('allows routine pushes and explicitly requested releases',()=>{
  expect(shouldBuild({environment:'production',message:'fix a card',files:['v2/apps/web/app/page.tsx']})).toBe(true);
  expect(shouldBuild({environment:'production',message:'[release] batch',files:['v2/apps/web/app/page.tsx']})).toBe(true);
 });
 it('allows test-only and docs-only releases',()=>{
  expect(shouldBuild({environment:'production',message:'[release] docs',files:['docs/operations.md','v2/apps/web/test/foo.test.ts']})).toBe(true);
 });
 it('allows previews regardless of marker and builds without baseline history',()=>{
  expect(shouldBuild({environment:'preview',message:'[release] batch',files:null})).toBe(true);
  expect(shouldBuild({environment:'preview',message:'[preview] review',files:null})).toBe(true);
  expect(shouldBuild({environment:'production',message:'[release] bootstrap',files:null})).toBe(true);
 });
});
