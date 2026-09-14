'use client';

import { useEffect, useRef, useState } from 'react';

/** Match SVG coordinates to the available panel, keeping text legible on phones. */
export function useChartWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) {
        setWidth(Math.max(240, Math.min(960, Math.round(entry.contentRect.width))));
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
