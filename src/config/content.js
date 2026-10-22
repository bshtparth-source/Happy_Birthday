import contentData from './content.json';
import { validateContent } from './schema.js';
import { deriveStats } from '../utils/date.js';

let activeContent = null;

// Dynamically discover local image assets
const heroImages = import.meta.glob('../assets/images/hero/*.{webp,jpg,png,svg}', {
  eager: true,
  import: 'default',
});

const memoryImages = import.meta.glob('../assets/images/memories/*.{webp,jpg,png,svg}', {
  eager: true,
  import: 'default',
});

/**
 * Resolves a hero photo URL by id or fallback.
 * @param {string} id
 * @returns {string}
 */
export function resolveHeroPhoto(id) {
  const matchKey = Object.keys(heroImages).find((k) => k.includes(id));
  if (matchKey && heroImages[matchKey]) {
    return heroImages[matchKey];
  }
  const first = Object.values(heroImages)[0];
  return first || '';
}

/**
 * Resolves a memory photo URL by id or fallback.
 * @param {string} id
 * @returns {string}
 */
export function resolveMemoryPhoto(id) {
  const matchKey = Object.keys(memoryImages).find((k) => k.includes(id));
  if (matchKey && memoryImages[matchKey]) {
    return memoryImages[matchKey];
  }
  const first = Object.values(memoryImages)[0];
  return first || '';
}

/**
 * Loads, validates, and enriches content with derived statistical values.
 * @param {object} [overrideData] - Optional content object to validate and set
 * @returns {object} The validated content structure with derived data
 */
export function loadContent(overrideData = null) {
  const raw = overrideData || contentData;
  const validation = validateContent(raw);

  if (!validation.valid) {
    if (import.meta.env.DEV) {
      console.warn(`[Content Schema Validation Errors]:\n${validation.errors.join('\n')}`);
    }
  }

  const birthDate = raw.recipient?.birthDate || '2015-10-21';
  const stats = deriveStats(birthDate);

  activeContent = {
    ...raw,
    derived: {
      age: stats.years,
      candleCount: stats.years,
      stats,
    },
  };

  return activeContent;
}

/**
 * Returns the currently active content configuration.
 * @returns {object}
 */
export function getContent() {
  if (!activeContent) {
    return loadContent();
  }
  return activeContent;
}
