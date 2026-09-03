export function buildNaverBuildingAddressQuery(
  districtName: string,
  neighborhoodName: string,
  buildingName: string,
): string {
  const lotNumber = /^\((산?\d+(?:-\d+)?)\)$/.exec(buildingName.trim())?.[1];
  return [
    '서울특별시',
    districtName.trim(),
    neighborhoodName.trim(),
    lotNumber ?? buildingName.trim(),
  ].filter((value) => value.length > 0).join(' ');
}
