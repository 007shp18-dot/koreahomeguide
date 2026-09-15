import type { ManualBuilding } from '../../../lib/brief/manual';
// Add a source-checked per-building JSON file and parse it with manualBuildingSchema.
// Empty is intentional: no school journey or resident consensus is inferred from a portal listing.
export const BUILDING_MANUAL: Readonly<Record<string, ManualBuilding>> = {};
