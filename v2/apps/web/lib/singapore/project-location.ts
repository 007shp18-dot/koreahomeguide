export type UraProjectLocation = Readonly<{ latitude: number; longitude: number; provider: 'URA' }>;

/** Inverse Transverse Mercator, EPSG:3414 → geographic coordinates.
 * SLA projection parameters: https://app.sla.gov.sg/sirent/About/PlaneCoordinateSystem
 * X is easting, Y is northing. This is a project location, not a unit entrance.
 */
export function svy21ToWgs84(x: number | null, y: number | null): UraProjectLocation | null {
  if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 60000 || y < 0 || y > 60000) return null;
  const a = 6378137;
  const f = 1 / 298.257223563;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const rad = Math.PI / 180;
  const origin = (1 + 22 / 60) * rad;
  const meridian = (p: number) => a * ((1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * p
    - (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p)
    + (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p)
    - 35 * e2 ** 3 / 3072 * Math.sin(6 * p));
  const target = meridian(origin) + y - 38744.572;
  let phi = origin;
  for (let i = 0; i < 5; i++) {
    const radius = a * (1 - e2) / (1 - e2 * Math.sin(phi) ** 2) ** 1.5;
    phi += (target - meridian(phi)) / radius;
  }
  const sin = Math.sin(phi), cos = Math.cos(phi), tan = Math.tan(phi);
  const n = a / Math.sqrt(1 - e2 * sin ** 2);
  const r = a * (1 - e2) / (1 - e2 * sin ** 2) ** 1.5;
  const t = tan ** 2, c = ep2 * cos ** 2, d = (x - 28001.642) / n;
  const latitude = (phi - n * tan / r * (d ** 2 / 2
    - (5 + 3 * t + 10 * c - 4 * c ** 2 - 9 * ep2) * d ** 4 / 24
    + (61 + 90 * t + 298 * c + 45 * t ** 2 - 252 * ep2 - 3 * c ** 2) * d ** 6 / 720)) / rad;
  const longitude = 103 + 50 / 60 + (d - (1 + 2 * t + c) * d ** 3 / 6
    + (5 - 2 * c + 28 * t - 3 * c ** 2 + 8 * ep2 + 24 * t ** 2) * d ** 5 / 120) / cos / rad;
  if (latitude < 1.15 || latitude > 1.5 || longitude < 103.55 || longitude > 104.15) return null;
  return { latitude, longitude, provider: 'URA' };
}

export function resolveUraProjectLocation(records: readonly Readonly<{ x: number | null; y: number | null }>[]): UraProjectLocation | null {
  const points = records.filter((row): row is { x: number; y: number } => row.x !== null && row.y !== null && Number.isFinite(row.x) && Number.isFinite(row.y) && row.x >= 0 && row.x <= 60000 && row.y >= 0 && row.y <= 60000);
  const first = points[0];
  if (!first || points.some((point) => Math.hypot(point.x - first.x, point.y - first.y) > 250)) return null;
  return svy21ToWgs84(first.x, first.y);
}
