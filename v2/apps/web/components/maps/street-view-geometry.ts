export type StreetCoordinate = Readonly<{ latitude: number; longitude: number }>;

export function streetViewGeometry(camera: StreetCoordinate, building: StreetCoordinate, maxDistance: number) {
  const valid = (p: StreetCoordinate) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
    && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
  if (!valid(camera) || !valid(building)) return null;
  const rad = Math.PI / 180;
  const a = camera.latitude * rad;
  const b = building.latitude * rad;
  const delta = (building.longitude - camera.longitude) * rad;
  const h = Math.sin((b - a) / 2) ** 2 + Math.cos(a) * Math.cos(b) * Math.sin(delta / 2) ** 2;
  const distance = 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
  if (distance > maxDistance || distance < 1) return null;
  const heading = (Math.atan2(Math.sin(delta) * Math.cos(b),
    Math.cos(a) * Math.sin(b) - Math.sin(a) * Math.cos(b) * Math.cos(delta)) / rad + 360) % 360;
  return { distance, heading };
}
