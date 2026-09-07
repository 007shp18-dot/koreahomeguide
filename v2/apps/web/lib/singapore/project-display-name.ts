/** Presentation-only repairs for two verified names damaged in the source encoding.
 * Match name AND street; never rewrite snapshot IDs, records, digests or cohorts.
 * Verified 2026-09-07:
 * https://www.edgeprop.sg/condo-apartment/enchante
 * https://enchante.propertybook.sg/
 * https://www.propertyguru.com.sg/project/verde-joo-chiat-26221
 * https://www.99.co/singapore/sale/property/verd-joo-chiat-condo-oEVAipT5QCFrcBGKaLYgxs
 */
export function singaporeProjectDisplayName(project: Readonly<{ project: string; street: string }>): string {
  if (project.project === 'ENCHANT\uFFFD' && project.street === 'EVELYN ROAD') return 'ENCHANTÉ';
  if (project.project === 'VERD\uFFFD JOO CHIAT' && project.street === 'JOO CHIAT TERRACE') return 'VERDÉ JOO CHIAT';
  return project.project;
}
