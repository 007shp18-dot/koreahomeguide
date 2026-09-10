import { createHash } from 'node:crypto';

// Same sorted-key JSON bytes as the artifact serializer, with bounded buffering.
// Keep one field token intact so UTF-16 surrogate pairs cannot cross hash updates.
export function canonicalDigest(value: unknown): string {
  const hash = createHash('sha256');
  const ancestors = new Set<object>();
  let chunks: string[] = [];
  let length = 0;
  function write(token: string) {
    chunks.push(token);
    length += token.length;
    if (length >= 64 * 1024) flush();
  }
  function flush() {
    hash.update(chunks.join(''));
    chunks = [];
    length = 0;
  }
  function visit(item: unknown): void {
    if (item === null || typeof item !== 'object') {
      const token = JSON.stringify(item);
      if (token === undefined) throw new TypeError('Invalid JSON value.');
      write(token);
      return;
    }
    if (ancestors.has(item)) throw new TypeError('Cyclic JSON value.');
    ancestors.add(item);
    if (Array.isArray(item)) {
      write('[');
      for (let index = 0; index < item.length; index += 1) {
        if (index > 0) write(',');
        visit(item[index]);
      }
      write(']');
    } else {
      write('{');
      const keys = Object.keys(item).sort();
      for (let index = 0; index < keys.length; index += 1) {
        if (index > 0) write(',');
        const key = keys[index]!;
        write(JSON.stringify(key));
        write(':');
        visit((item as Record<string, unknown>)[key]);
      }
      write('}');
    }
    ancestors.delete(item);
  }
  visit(value);
  flush();
  return hash.digest('hex');
}
