import seoul from './revisions/journey-seoul.json';
import singapore from './revisions/journey-singapore.json';
import dubai from './revisions/journey-dubai.json';
import tokyo from './revisions/journey-tokyo.json';
import type { JourneyArticle } from './city-journey-articles';
import type { CityStory, StorySection } from './city-stories';

type SectionCopy = readonly [string, string, string, string];
type ArticleCopy = readonly [string, string, string, string, readonly SectionCopy[]];
const raw: Readonly<Record<string, unknown>> = { ...seoul, ...singapore, ...dubai, ...tokyo };
const editedAt = '2026-09-14';

function copyFor(key: string): ArticleCopy {
  const value = raw[key];
  if (!Array.isArray(value) || value.length !== 5
    || !value.slice(0, 4).every(item => typeof item === 'string' && item.trim())
    || !Array.isArray(value[4]) || !value[4].every(section => Array.isArray(section)
      && section.length === 4 && section.every(item => typeof item === 'string' && item.trim()))) {
    throw new Error(`Missing or invalid bilingual journey revision: ${key}`);
  }
  return value as unknown as ArticleCopy;
}

export function reviseJourneyArticle(article: JourneyArticle): JourneyArticle {
  const [en, ko, enDeck, koDeck, sections] = copyFor(`${article.city}/${article.id}`);
  if (sections.length !== article.sections.length) throw new Error(`Journey section count changed: ${article.city}/${article.id}`);
  return {
    ...article, title: { en, ko }, deck: { en: enDeck, ko: koDeck }, editedAt,
    // Keep original evidence-check dates, source mappings, tables and photo anchor IDs.
    sections: article.sections.map((section, index) => {
      const [enTitle, koTitle, enBody, koBody] = sections[index]!;
      return { ...section, title: { en: enTitle, ko: koTitle }, paragraphs: { en: enBody.split('\n\n'), ko: koBody.split('\n\n') } };
    }),
  };
}

export function reviseCityStory(story: CityStory): CityStory {
  const [en, ko, enDeck, koDeck] = copyFor(`${story.city}/discover`);
  const revise = (section: StorySection): StorySection => {
    const [enTitle, koTitle, enSummary, koSummary] = copyFor(`${story.city}/${section.id}`);
    return { ...section, title: { en: enTitle, ko: koTitle }, paragraphs: { en: [enSummary], ko: [koSummary] } };
  };
  return { ...story, title: { en, ko }, deck: { en: enDeck, ko: koDeck }, sections: [
    revise(story.sections[0]), revise(story.sections[1]), revise(story.sections[2]),
    revise(story.sections[3]), revise(story.sections[4]), revise(story.sections[5]),
  ] };
}
