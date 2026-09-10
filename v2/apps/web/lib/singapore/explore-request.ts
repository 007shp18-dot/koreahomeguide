/** Retry one transient cold-start failure; never retry an obsolete selection. */
export async function requestSingaporeExplore(url: string, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<unknown> {
  for (let attempt = 0; attempt < 2; attempt++) {
    signal.throwIfAborted();
    try {
      const response = await fetcher(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) });
      if (response.ok) return await response.json();
      if (response.status < 500 && response.status !== 408) throw new PermanentExploreError();
      throw new Error('Explore temporarily unavailable');
    } catch (error) {
      signal.throwIfAborted();
      if (attempt === 1 || error instanceof PermanentExploreError) throw error;
    }
  }
  throw new Error('Explore unavailable');
}
class PermanentExploreError extends Error {}
