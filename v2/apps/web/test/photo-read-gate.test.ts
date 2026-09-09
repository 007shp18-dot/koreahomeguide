import {expect, it, vi} from 'vitest';
import {createPhotoReadGate} from '../lib/photos/photo-read-gate';

it('shares only pending reads and observes a later revocation', async () => {
  let resolve!: (value: string[]) => void;
  const read = vi.fn(() => new Promise<string[]>(done => {resolve=done;}));
  const gate = createPhotoReadGate<string[]>();
  const a=gate('building',read), b=gate('building',read);
  await Promise.resolve();
  expect(read).toHaveBeenCalledTimes(1);
  resolve(['approved']);
  expect(await a).toEqual(['approved']);expect(await b).toEqual(['approved']);
  expect(await gate('building',async () => [])).toEqual([]);
});
it('fails closed during an outage and allows only one recovery probe', async () => {
  let time=100;const onError=vi.fn();
  const gate=createPhotoReadGate<string[]>({now:()=>time,cooldownMs:15,onError});
  expect(await gate('a',async()=>{throw Error('offline');})).toBeNull();
  const skipped=vi.fn(async()=>['must not return stale photo']);
  expect(await gate('b',skipped)).toBeNull();expect(skipped).not.toHaveBeenCalled();
  time=116;
  let resolve!: (value:string[])=>void;
  const probe=gate('a',()=>new Promise<string[]>(done=>{resolve=done;}));
  await Promise.resolve();
  expect(await gate('b',skipped)).toBeNull();
  resolve([]);expect(await probe).toEqual([]);
  expect(await gate('b',async()=>['freshly approved'])).toEqual(['freshly approved']);
  expect(onError).toHaveBeenCalledTimes(1);
});
it('bounds simultaneous distinct reads without preventing a later retry', async () => {
  let resolve!: (value:string[])=>void;
  const gate=createPhotoReadGate<string[]>({maxPending:1});
  const pending=gate('a',()=>new Promise<string[]>(done=>{resolve=done;}));
  await Promise.resolve();
  const read=vi.fn(async()=>[]);
  expect(await gate('b',read)).toBeNull();expect(read).not.toHaveBeenCalled();
  resolve([]);await pending;
  expect(await gate('b',read)).toEqual([]);
});
