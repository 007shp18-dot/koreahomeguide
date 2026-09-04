export type ThreeMarketHeroState = Readonly<{
  activeIndex: number;
  autoRotate: boolean;
}>;

export function selectHomeMarket(
  state: ThreeMarketHeroState,
  activeIndex: number,
): ThreeMarketHeroState {
  if (!Number.isInteger(activeIndex) || activeIndex < 0) return state;
  return Object.freeze({ activeIndex, autoRotate: false });
}

export function advanceHomeMarket(
  state: ThreeMarketHeroState,
  marketCount: number,
): ThreeMarketHeroState {
  if (!state.autoRotate || !Number.isInteger(marketCount) || marketCount < 2) return state;
  return Object.freeze({ activeIndex: (state.activeIndex + 1) % marketCount, autoRotate: true });
}
