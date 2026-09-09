import 'server-only';
import { revalidatePath } from 'next/cache';
import { resetSingaporePublicationCache } from './publication.server';
export function invalidateSingaporePublicationPages(resetReader = true) {
 if (resetReader) resetSingaporePublicationCache();
 for (const prefix of ['/sg/singapore','/ko/sg/singapore']) {
  revalidatePath(`${prefix}/explore`, 'page');
  revalidatePath(`${prefix}/explore/[area]`, 'page');
  revalidatePath(`${prefix}/explore/[area]/[projectId]`, 'page');
  revalidatePath(`${prefix}/check`, 'page');
  revalidatePath(`${prefix}/rankings`, 'page');
  revalidatePath(prefix, 'page');
 }
}
