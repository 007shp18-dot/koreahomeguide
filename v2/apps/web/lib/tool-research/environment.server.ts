import 'server-only';

import { contentDatabase } from '../db/postgres.server';
import {
  createToolResearchRepository,
  type ToolResearchRepository,
  type ToolResearchSqlPort,
} from './repository.server';

export function toolResearchRepositoryFromEnvironment(): ToolResearchRepository | null {
  const sql = contentDatabase();
  if (sql === null) return null;
  const port: ToolResearchSqlPort = Object.freeze({
    query: async (statement, parameters = []) => sql.query(statement, [...parameters]),
  });
  return createToolResearchRepository(port);
}

export function createToolResearchEnvironment() {
  return Object.freeze({
    repository: toolResearchRepositoryFromEnvironment(),
    collectionEnabled: process.env.SIGNEDPRICE_TOOL_RESEARCH_ENABLED?.trim().toLowerCase() !== 'false',
  });
}
