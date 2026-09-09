/** Share pending reads only. Never cache an approval that may later be revoked. */
export function createPhotoReadGate<T>({now = Date.now, onError = () => {}, cooldownMs = 15_000, maxPending = 32}: {
  now?: () => number; onError?: (error: unknown) => void; cooldownMs?: number; maxPending?: number;
} = {}) {
  const pending = new Map<string, Promise<T | null>>();
  let retryAt = 0;
  let recovering = false;
  return async (key: string, read: () => Promise<T>): Promise<T | null> => {
    const existing = pending.get(key);
    if (existing) return existing;
    if (now() < retryAt || pending.size >= maxPending || recovering) return null;
    const probe = retryAt > 0;
    if (probe) recovering = true;
    const operation = Promise.resolve().then(read).catch(error => {
      retryAt = now() + cooldownMs;
      onError(error);
      return null;
    }).then(value => {
      if (probe && value !== null) retryAt = 0;
      return value;
    }).finally(() => {
      pending.delete(key);
      if (probe) recovering = false;
    });
    pending.set(key, operation);
    return operation;
  };
}
