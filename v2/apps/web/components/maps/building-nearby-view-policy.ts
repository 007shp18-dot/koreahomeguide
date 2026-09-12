const MAP_ONLY_SEOUL_BUILDINGS = Object.freeze([
  'nineonehannam',
  '나인원한남',
]);

function normalizedBuildingName(value: string) {
  return value.toLocaleLowerCase('en-US').replace(/[^a-z0-9가-힣]/g, '');
}

export function seoulBuildingViewMode(buildingName: string): 'map' | 'panorama' {
  const normalized = normalizedBuildingName(buildingName);
  return MAP_ONLY_SEOUL_BUILDINGS.some((name) => normalized.includes(name))
    ? 'map'
    : 'panorama';
}
