import 'server-only';

import { contentDatabase } from '../db/postgres.server';
import type { InfographicRenderRecord, InfographicSpec } from './infographic-types';
import {
  stableInfographicHash,
  validateInfographicRenderRecord,
  validateInfographicSpec,
} from './infographic-validator';

export type InfographicRepository = Readonly<{
  list(): readonly InfographicSpec[];
  get(id: string): InfographicSpec | null;
  addRender(value: unknown): InfographicRenderRecord;
  listRenders(infographicId: string): readonly InfographicRenderRecord[];
}>;

function sameReleaseSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && [...left].sort().every((releaseId, index) => releaseId === [...right].sort()[index]);
}

export function createInfographicRepository(values: readonly unknown[]): InfographicRepository {
  const specifications = Object.freeze(values.map(validateInfographicSpec));
  if (new Set(specifications.map(({ id }) => id)).size !== specifications.length) {
    throw new TypeError('Duplicate infographic identity.');
  }
  const renders: InfographicRenderRecord[] = [];
  return Object.freeze({
    list: () => specifications,
    get: (id) => specifications.find((specification) => specification.id === id) ?? null,
    addRender(value) {
      const render = validateInfographicRenderRecord(value);
      const specification = specifications.find(({ id }) => id === render.infographicId);
      if (specification === undefined) throw new TypeError('Unknown infographic specification.');
      if (render.specHash !== stableInfographicHash(specification)) {
        throw new TypeError('Infographic render specification hash does not match.');
      }
      if (!sameReleaseSet(render.evidenceReleaseIds, specification.evidenceReleaseIds)) {
        throw new TypeError('Infographic render evidence releases do not match.');
      }
      if (renders.some(({ id }) => id === render.id)) throw new TypeError('Duplicate infographic render identity.');
      renders.push(render);
      return render;
    },
    listRenders(infographicId) {
      return Object.freeze(renders.filter((render) => render.infographicId === infographicId));
    },
  });
}

export async function saveInfographicSpecification(value: unknown): Promise<InfographicSpec> {
  const specification = validateInfographicSpec(value);
  const sql = contentDatabase();
  if (sql === null) throw new Error('database_not_configured');
  const hash = stableInfographicHash(specification);
  await sql`
    INSERT INTO infographic_specs (
      id, template, locale, title, spec_hash, spec_json, evidence_release_ids, updated_at
    ) VALUES (
      ${specification.id}, ${specification.template}, ${specification.locale}, ${specification.title},
      ${hash}, ${JSON.stringify(specification)}::jsonb,
      ${JSON.stringify(specification.evidenceReleaseIds)}::jsonb, now()
    )
    ON CONFLICT (id) DO UPDATE SET
      template = excluded.template,
      locale = excluded.locale,
      title = excluded.title,
      spec_hash = excluded.spec_hash,
      spec_json = excluded.spec_json,
      evidence_release_ids = excluded.evidence_release_ids,
      updated_at = now()
  `;
  return specification;
}

export async function saveInfographicRender(value: unknown): Promise<InfographicRenderRecord> {
  const render = validateInfographicRenderRecord(value);
  const sql = contentDatabase();
  if (sql === null) throw new Error('database_not_configured');
  await sql`
    INSERT INTO infographic_renders (
      id, infographic_id, renderer_version, spec_hash, width, height, format,
      generated_at, object_url, ownership
    ) VALUES (
      ${render.id}, ${render.infographicId}, ${render.rendererVersion}, ${render.specHash},
      ${render.width}, ${render.height}, ${render.format}, ${render.generatedAt},
      ${render.objectUrl}, ${render.ownership}
    )
    ON CONFLICT (id) DO UPDATE SET
      renderer_version = excluded.renderer_version,
      spec_hash = excluded.spec_hash,
      width = excluded.width,
      height = excluded.height,
      format = excluded.format,
      generated_at = excluded.generated_at,
      object_url = excluded.object_url,
      ownership = excluded.ownership
  `;
  for (const evidenceReleaseId of render.evidenceReleaseIds) {
    await sql`
      INSERT INTO infographic_render_evidence (render_id, evidence_release_id)
      VALUES (${render.id}, ${evidenceReleaseId})
      ON CONFLICT (render_id, evidence_release_id) DO NOTHING
    `;
  }
  return render;
}
