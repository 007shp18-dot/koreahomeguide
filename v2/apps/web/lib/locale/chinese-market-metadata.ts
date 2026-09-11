import { indexableMetadata as buildMetadata } from '../public-metadata';

/** The Chinese route renders the same market model and owns its canonical URL. */
export function indexableMetadata(input: Parameters<typeof buildMetadata>[0]) {
  return buildMetadata({ ...input, locale: 'zh_CN' });
}
