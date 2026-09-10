/** Keep a selected result visible after a deep link, map click, or sort change. */
export function selectedResultPage(
  ids: readonly string[], selectedId: string | null, requestedPage: number, pageSize: number,
): number {
  const index = selectedId === null ? -1 : ids.indexOf(selectedId);
  if (index >= 0) return Math.floor(index / pageSize) + 1;
  return Math.min(Math.max(1, requestedPage), Math.max(1, Math.ceil(ids.length / pageSize)));
}
