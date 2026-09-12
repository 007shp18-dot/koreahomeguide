'use client';
import { useCallback, useEffect, useState } from 'react';
import { comparisonFromHash, comparisonHash, DUBAI_COMPARISON_STORAGE_KEY, saveComparison, savedComparisons, type DubaiComparison } from '../../lib/dubai/comparison';

export function useDubaiComparison() {
  const [ids, setIds] = useState<readonly string[]>([]);
  const [preset, setPreset] = useState<DubaiComparison | null>(null);
  const [saved, setSaved] = useState<DubaiComparison[]>([]);
  const [storageError, setStorageError] = useState(false);
  const restore = useCallback((value: DubaiComparison) => {
    setIds(value.areas);
    setPreset(value);
  }, []);
  useEffect(() => {
    // Hydrate browser-only storage after SSR; exactly one initial read, never polling.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setSaved(savedComparisons(window.localStorage.getItem(DUBAI_COMPARISON_STORAGE_KEY))); }
    catch { /* Storage may be disabled; comparison and sharing still work. */ }
    const readHash = () => {
      const value = comparisonFromHash(window.location.hash);
      if (value) restore(value);
      else setPreset(null);
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, [restore]);
  const open = (value: DubaiComparison) => {
    restore(value);
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${comparisonHash(value)}`);
  };
  const close = () => {
    setPreset(null);
    if (window.location.hash.startsWith('#compare=')) window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
  };
  const persist = (next: DubaiComparison[]) => {
    try {
      window.localStorage.setItem(DUBAI_COMPARISON_STORAGE_KEY, JSON.stringify(next));
      setSaved(next);
      setStorageError(false);
      return true;
    } catch { setStorageError(true); return false; }
  };
  return { ids, preset, saved, storageError, open, close,
    toggle: (slug: string) => setIds(current => current.includes(slug) ? current.filter(id => id !== slug) : current.length < 3 ? [...current, slug] : current),
    clear: () => setIds([]),
    save: (value: DubaiComparison) => {
      // Merge with the latest storage value so another open tab is not overwritten.
      try { return persist(saveComparison(savedComparisons(window.localStorage.getItem(DUBAI_COMPARISON_STORAGE_KEY)), value)); }
      catch { setStorageError(true); return false; }
    },
    remove: (value: DubaiComparison) => {
      try { persist(savedComparisons(window.localStorage.getItem(DUBAI_COMPARISON_STORAGE_KEY)).filter(item => comparisonHash(item) !== comparisonHash(value))); }
      catch { setStorageError(true); }
    },
  };
}
