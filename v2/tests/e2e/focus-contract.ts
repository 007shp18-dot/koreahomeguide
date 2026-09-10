import type { Locator } from '@playwright/test';

export type ComputedFocusPaint = {
  readonly boxShadow: string;
  readonly outlineColor: string;
  readonly outlineStyle: string;
  readonly outlineWidth: string;
};

function isTransparent(color: string): boolean {
  return color === 'transparent' || /rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(color);
}

export function hasComputedVisibleFocus(paint: ComputedFocusPaint): boolean {
  const visibleOutline = paint.outlineStyle !== 'none' && paint.outlineStyle !== 'hidden' &&
    Number.parseFloat(paint.outlineWidth) >= 2 && !isTransparent(paint.outlineColor);
  const visibleShadow = paint.boxShadow !== 'none' &&
    !/^rgba\([^)]*,\s*0(?:\.0+)?\s*\)(?:\s+0px){2,}/.test(paint.boxShadow);
  return visibleOutline || visibleShadow;
}

export async function readComputedFocusPaint(locator: Locator): Promise<ComputedFocusPaint> {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      boxShadow: style.boxShadow,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });
}
