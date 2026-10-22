/**
 * Unified schema definition and validation rules shared by the application and the Studio.
 */
export const SCHEMA = {
  recipient: {
    firstName: { maxLength: 30, required: true },
    fullName: { maxLength: 60, required: true },
    birthDate: { required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ },
  },
  sender: {
    name: { maxLength: 60, required: true },
  },
  hero: {
    eyebrow: { maxLength: 60 },
    tagline: { maxLength: 140, required: true },
    photo: {
      alt: { maxLength: 120, required: true },
    },
  },
  candles: {
    wishMessage: { maxLength: 80 },
  },
  scratchReward: {
    title: { maxLength: 60 },
    message: { maxLength: 200, required: true },
  },
  memories: {
    minItems: 2,
    maxItems: 8,
    item: {
      alt: { maxLength: 120, required: true },
      caption: { maxLength: 40 },
      tag: { maxLength: 24 },
    },
  },
  letter: {
    greeting: { maxLength: 60 },
    paragraphs: { minItems: 1, maxItems: 5, itemMaxLength: 400 },
    closing: { maxLength: 80 },
  },
  reasons: {
    minItems: 2,
    maxItems: 6,
    item: {
      title: { maxLength: 28, required: true },
      text: { maxLength: 110, required: true },
    },
  },
  finale: {
    eyebrow: { maxLength: 60 },
    message: { maxLength: 200 },
    closingLine: { maxLength: 80 },
  },
  music: {
    title: { maxLength: 60 },
  },
};

/**
 * Validates a content object against the defined schema constraints.
 * @param {object} content - The content configuration to validate.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateContent(content) {
  const errors = [];

  function checkField(value, rules, path) {
    if (rules.required && (!value || String(value).trim() === '')) {
      errors.push(`${path} is required`);
      return;
    }
    if (rules.maxLength && value && value.length > rules.maxLength) {
      errors.push(`${path} exceeds maximum length of ${rules.maxLength} characters`);
    }
    if (rules.pattern && value && !rules.pattern.test(value)) {
      errors.push(`${path} does not match expected format`);
    }
  }

  // Recipient validation
  checkField(content?.recipient?.firstName, SCHEMA.recipient.firstName, 'recipient.firstName');
  checkField(content?.recipient?.fullName, SCHEMA.recipient.fullName, 'recipient.fullName');
  checkField(content?.recipient?.birthDate, SCHEMA.recipient.birthDate, 'recipient.birthDate');

  // Sender validation
  checkField(content?.sender?.name, SCHEMA.sender.name, 'sender.name');

  // Hero validation
  checkField(content?.hero?.tagline, SCHEMA.hero.tagline, 'hero.tagline');
  checkField(content?.hero?.photo?.alt, SCHEMA.hero.photo.alt, 'hero.photo.alt');

  // Scratch reward validation
  checkField(
    content?.scratchReward?.message,
    SCHEMA.scratchReward.message,
    'scratchReward.message'
  );

  // Memories validation
  const mems = content?.memories || [];
  if (mems.length < SCHEMA.memories.minItems || mems.length > SCHEMA.memories.maxItems) {
    errors.push(
      `memories must contain between ${SCHEMA.memories.minItems} and ${SCHEMA.memories.maxItems} items`
    );
  }
  mems.forEach((m, i) => {
    checkField(m?.alt, SCHEMA.memories.item.alt, `memories[${i}].alt`);
    if (m?.caption) checkField(m.caption, SCHEMA.memories.item.caption, `memories[${i}].caption`);
    if (m?.tag) checkField(m.tag, SCHEMA.memories.item.tag, `memories[${i}].tag`);
  });

  // Letter validation
  const paragraphs = content?.letter?.paragraphs || [];
  if (
    paragraphs.length < SCHEMA.letter.paragraphs.minItems ||
    paragraphs.length > SCHEMA.letter.paragraphs.maxItems
  ) {
    errors.push(
      `letter.paragraphs must contain between ${SCHEMA.letter.paragraphs.minItems} and ${SCHEMA.letter.paragraphs.maxItems} paragraphs`
    );
  }
  paragraphs.forEach((p, i) => {
    if (p.length > SCHEMA.letter.paragraphs.itemMaxLength) {
      errors.push(
        `letter.paragraphs[${i}] exceeds maximum length of ${SCHEMA.letter.paragraphs.itemMaxLength} characters`
      );
    }
  });

  // Reasons validation
  const reasons = content?.reasons || [];
  if (reasons.length < SCHEMA.reasons.minItems || reasons.length > SCHEMA.reasons.maxItems) {
    errors.push(
      `reasons must contain between ${SCHEMA.reasons.minItems} and ${SCHEMA.reasons.maxItems} items`
    );
  }
  reasons.forEach((r, i) => {
    checkField(r?.title, SCHEMA.reasons.item.title, `reasons[${i}].title`);
    checkField(r?.text, SCHEMA.reasons.item.text, `reasons[${i}].text`);
  });

  return { valid: errors.length === 0, errors };
}
