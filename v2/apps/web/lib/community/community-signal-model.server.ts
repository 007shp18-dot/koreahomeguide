import 'server-only';

import {
  createCommunityEnvironment,
  type CommunityEnvironment,
} from './community-environment.server';
import type { CommunitySignalModel } from './community-signal-model';
import type { CommunityEvidenceScope } from './community-types';

export function unavailableCommunitySignalModel(): CommunitySignalModel {
  return Object.freeze({
    state: 'unavailable',
    scope: null,
    code: 'evidence_unavailable',
  });
}

export function buildCommunitySignalModel(
  scope: CommunityEvidenceScope,
  environment: CommunityEnvironment = createCommunityEnvironment(),
): CommunitySignalModel {
  if (environment.state === 'unavailable') {
    return Object.freeze({
      state: 'unavailable',
      scope,
      code: environment.code,
    });
  }
  return Object.freeze({ state: 'available', scope });
}
