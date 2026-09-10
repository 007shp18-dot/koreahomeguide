import {describe,it,expect} from 'vitest';
// @ts-expect-error JS release script is shared with Vercel's ignored build command.
import {shouldBuild} from '../../scripts/release/ignore-build.mjs';
describe('release build policy',()=>{
 it('always allows production and main deployments',()=>{
  expect(shouldBuild({environment:'production',branch:'main',message:'fix a card'})).toBe(true);
  expect(shouldBuild({environment:'preview',branch:'main',message:'merge queue'})).toBe(true);
 });
 it('skips routine preview pushes and permits an explicit hosted preview',()=>{
  expect(shouldBuild({environment:'preview',branch:'feat/cards',message:'fix a card'})).toBe(false);
  expect(shouldBuild({environment:'preview',branch:'feat/cards',message:'[vercel-preview] review cards'})).toBe(true);
 });
 it('builds safely when Vercel Git metadata is unavailable',()=>{
  expect(shouldBuild({})).toBe(true);
 });
});
