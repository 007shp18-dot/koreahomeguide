import { afterEach, describe, expect, it, vi } from 'vitest';
import { observeGoogleMapsReady, type GoogleMapsSdk } from '../components/maps/google-place-map';

const readySdk = { Map: class {}, Marker: class {}, Geocoder: class {} } as unknown as GoogleMapsSdk;
function scope() { return new EventTarget() as EventTarget & { google?: { maps?: Partial<GoogleMapsSdk> } }; }
afterEach(() => vi.useRealTimers());

describe('Google SDK readiness across client navigation', () => {
  it('mounts from an already loaded SDK without needing its old callback flag', async () => {
    vi.useFakeTimers();
    const target = scope(); target.google = { maps: readySdk };
    const ready = vi.fn(); const failed = vi.fn();
    observeGoogleMapsReady(target, ready, failed);
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(ready).toHaveBeenCalledOnce(); expect(failed).not.toHaveBeenCalled();
  });
  it('waits for actual constructors after an early async script load event', async () => {
    vi.useFakeTimers();
    const target = scope(); target.google = { maps: {} };
    const ready = vi.fn(); const failed = vi.fn();
    observeGoogleMapsReady(target, ready, failed);
    target.dispatchEvent(new Event('signedprice:google-maps-ready'));
    await vi.advanceTimersByTimeAsync(500); expect(ready).not.toHaveBeenCalled();
    target.google.maps = readySdk;
    await vi.advanceTimersByTimeAsync(250); expect(ready).toHaveBeenCalledOnce();
    expect(failed).not.toHaveBeenCalled();
  });
  it('recovers when a slow SDK finishes after the loading deadline', async () => {
    vi.useFakeTimers();
    const target = scope(); const ready = vi.fn(); const failed = vi.fn();
    observeGoogleMapsReady(target, ready, failed, 1000);
    await vi.advanceTimersByTimeAsync(1000); expect(failed).toHaveBeenCalledOnce();
    target.google = { maps: readySdk };
    target.dispatchEvent(new Event('signedprice:google-maps-ready'));
    expect(ready).toHaveBeenCalledOnce();
    target.dispatchEvent(new Event('signedprice:google-maps-ready'));
    expect(ready).toHaveBeenCalledOnce();
  });
  it('finishes a blocked load and cancels checks when a route unmounts', async () => {
    vi.useFakeTimers();
    const ready = vi.fn(); const failed = vi.fn();
    observeGoogleMapsReady(scope(), ready, failed, 1000);
    await vi.advanceTimersByTimeAsync(1000); expect(failed).toHaveBeenCalledOnce();
    const target = scope(); const staleReady = vi.fn(); const staleFailure = vi.fn();
    const cancel = observeGoogleMapsReady(target, staleReady, staleFailure, 1000);
    cancel(); target.google = { maps: readySdk };
    target.dispatchEvent(new Event('signedprice:google-maps-ready'));
    await vi.advanceTimersByTimeAsync(2000);
    expect(staleReady).not.toHaveBeenCalled(); expect(staleFailure).not.toHaveBeenCalled();
    expect(ready).not.toHaveBeenCalled();
  });
});
