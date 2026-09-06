import type { GoogleMarketMapPoint } from '../../components/maps/google-place-map';

type Project = Readonly<{
  id: string; name: string; street: string; district: string;
  location?: Readonly<{ latitude: number; longitude: number }> | null;
}>;

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
  const locatedCount = points.length;
  const unplacedGroups: { district: string; count: number }[] = [];
  let areaOnly = 0;
  for (const [district, count] of missing) {
    const anchor = anchors.get(district);
    if (anchor === undefined) { unplacedGroups.push({ district, count }); continue; }
    points.push({ id: `district-${district}`, title: `District ${district} · ${count} projects · approximate area, not project locations`,
      label: `D${district} · ${count} · Area only`, kind: 'area', count,
      latitude: anchor.lat / anchor.n, longitude: anchor.lng / anchor.n });
    areaOnly += count;
  }
  return { points, total: projects.length, located: locatedCount, areaOnly,
    unplaced: projects.length - locatedCount - areaOnly, unplacedGroups };
}
