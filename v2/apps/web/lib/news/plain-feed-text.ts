const entities: Readonly<Record<string, string>> = Object.freeze({
  amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
});

/** Normalize up to two transport-encoding layers, never interpret the result as HTML. */
export function plainFeedText(value: string): string {
  const decode = (source: string) => source.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, rawCode: string) => {
    const code = rawCode.toLowerCase();
    if (!code.startsWith('#')) return entities[code] ?? entity;
    const point = Number.parseInt(code.slice(code.startsWith('#x') ? 2 : 1), code.startsWith('#x') ? 16 : 10);
    return Number.isInteger(point) && point > 0 && point <= 0x10ffff && (point < 0xd800 || point > 0xdfff)
      ? String.fromCodePoint(point) : entity;
  });
  return decode(decode(value)).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
