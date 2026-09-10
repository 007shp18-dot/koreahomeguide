export type RouteReadiness = 'indexable' | 'noindex';

export type ReadinessInput = {
  contentReady: boolean;
  rightsCanIndex: boolean;
  domainReady: boolean;
};

export function evaluateReadiness(input: ReadinessInput): RouteReadiness {
  return input.contentReady && input.rightsCanIndex && input.domainReady
    ? 'indexable'
    : 'noindex';
}
