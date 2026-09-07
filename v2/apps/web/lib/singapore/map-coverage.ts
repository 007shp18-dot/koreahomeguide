import type { GoogleMarketMapPoint } from '../../components/maps/google-place-map';

type Project = Readonly<{
  id: string; name: string; street: string; district: string;
  segment?: string;
  location?: Readonly<{ latitude: number; longitude: number }> | null;
}>;

export function buildSingaporeAreaMapCoverage(
  projects: readonly Project[],
  anchorProjects: readonly Project[],
  level: 'region' | 'district',
) {
  const keyOf = (project: Project) => level === 'region' ? project.segment ?? '' : project.district;
  const anchors = new Map<string, { lat: number; lng: number; n: number }>();
  for (const project of anchorProjects) {
    const key = keyOf(project);
    if (key === '' || !located(project)) continue;
    const anchor = anchors.get(key) ?? { lat: 0, lng: 0, n: 0 };
    anchor.lat += project.location!.latitude; anchor.lng += project.location!.longitude; anchor.n += 1;
    anchors.set(key, anchor);
  }
  const counts = new Map<string, number>();
  for (const project of projects) {
    const key = keyOf(project);
    if (key !== '') counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const unplacedGroups: { id: string; label: string; count: number }[] = [];
  const points: GoogleMarketMapPoint[] = [];
  for (const [key, count] of [...counts].sort(([left], [right]) => left.localeCompare(right))) {
    const label = level === 'region' ? key : `District ${key}`;
    const anchor = anchors.get(key);
    if (anchor === undefined) { unplacedGroups.push({ id: `${level}-${key}`, label, count }); continue; }
    points.push({
      id: `${level}-${key}`,
      title: `${label} · ${count} projects`,
      label: `${level === 'region' ? key : `D${key}`} · ${count}`,
      kind: 'area',
      level,
      count,
      latitude: anchor.lat / anchor.n,
      longitude: anchor.lng / anchor.n,
    });
  }
  return { points: Object.freeze(points), total: projects.length,
    represented: points.reduce((sum, point) => sum + (point.count ?? 0), 0),
    unplaced: unplacedGroups.reduce((sum, group) => sum + group.count, 0),
    unplacedGroups: Object.freeze(unplacedGroups) };
}

function located(project: Project): boolean {
  const point = project.location;
  return point != null && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
    && point.latitude >= 1.15 && point.latitude <= 1.5
    && point.longitude >= 103.55 && point.longitude <= 104.15;
}

/** Area references are means of known source project coordinates in the same
 * postal district, not inferred coordinates for the missing projects. */
export function buildSingaporeMapCoverage(projects: readonly Project[], anchorProjects: readonly Project[], selectedId: string | null) {
  const anchors = new Map<string, { lat: number; lng: number; n: number }>();
  for (const project of anchorProjects) {
    if (!located(project)) continue;
    const anchor = anchors.get(project.district) ?? { lat: 0, lng: 0, n: 0 };
    anchor.lat += project.location!.latitude; anchor.lng += project.location!.longitude; anchor.n += 1;
    anchors.set(project.district, anchor);
  }
  const points: GoogleMarketMapPoint[] = [];
  const missing = new Map<string, number>();
  for (const project of projects) {
    if (!located(project)) { missing.set(project.district, (missing.get(project.district) ?? 0) + 1); continue; }
    points.push({ id: `project-${project.id}`, title: `${project.name} · ${project.street}`,
      label: project.name, ...project.location!, selected: project.id === selectedId });
  }
  const selectedMissing = projects.find(project => project.id === selectedId && !located(project));
  const locatedCount = points.length;
  const unplacedGroups: { district: string; count: number }[] = [];
  let areaOnly = 0;
  for (const [district, count] of missing) {
    const anchor = anchors.get(district);
    if (anchor === undefined) { unplacedGroups.push({ district, count }); continue; }
    points.push({ id: `district-${district}`, title: `District ${district} · ${count} projects · approximate area, not project locations`,
      label: `D${district} · ${count} · Area only`, kind: 'area', count, selected: selectedMissing?.district === district,
      latitude: anchor.lat / anchor.n, longitude: anchor.lng / anchor.n });
    areaOnly += count;
  }
  return { points, total: projects.length, located: locatedCount, areaOnly,
    unplaced: projects.length - locatedCount - areaOnly, unplacedGroups };
}
