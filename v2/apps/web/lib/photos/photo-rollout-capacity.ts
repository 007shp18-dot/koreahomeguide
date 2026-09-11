export function photoRolloutCapacity(input: Readonly<{
  pendingBuildings: number;
  dailyRequestCap: number;
  dailySpendCapUsd: number;
  estimatedRequestCostUsd: number;
  scheduledRequestsPerDay: number;
}>) {
  const values = Object.values(input);
  if (values.some(value => !Number.isFinite(value) || value < 0) || input.estimatedRequestCostUsd <= 0) {
    throw new RangeError('Invalid photo rollout limits');
  }
  const requestsPerDay = Math.max(0, Math.min(Math.floor(input.dailyRequestCap),
    Math.floor((input.dailySpendCapUsd + Number.EPSILON) / input.estimatedRequestCostUsd),
    Math.floor(input.scheduledRequestsPerDay)));
  return Object.freeze({
    pendingBuildings: input.pendingBuildings,
    requestsPerDay,
    minimumDaysForOnePass: input.pendingBuildings === 0 ? 0
      : requestsPerDay === 0 ? null : Math.ceil(input.pendingBuildings / requestsPerDay),
    estimatedOnePassCostUsd: Math.round(input.pendingBuildings * input.estimatedRequestCostUsd * 100) / 100,
    estimatedDailyCostUsd: Math.round(requestsPerDay * input.estimatedRequestCostUsd * 100) / 100,
    photoCoverageGuaranteed: false,
    estimateBasis: 'One discovery request per building; retries and photo views excluded.',
  });
}
