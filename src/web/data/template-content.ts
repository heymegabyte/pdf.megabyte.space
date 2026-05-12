// Per-template rich content. Keyed by slug. Merged into TemplateHubEntry at lookup time
// via getTemplateContent(slug). Each entry must include: 300-1000 word richBody,
// 2-3 APA citations, 3-4 mediaGallery items (Pexels photo + DALL-E illustration + Google Images search deep-link).

import type { RichContent } from "./rich-content";
import { BUSINESS_CONTENT } from "./template-content/business";
import { PERSONAL_CONTENT } from "./template-content/personal";
import { EDUCATION_CONTENT } from "./template-content/education";
import { EVENTS_CONTENT } from "./template-content/events";
import { MARKETING_CONTENT } from "./template-content/marketing";
import { LIFESTYLE_CONTENT } from "./template-content/lifestyle";

export const TEMPLATE_CONTENT: Record<string, RichContent> = {
  ...BUSINESS_CONTENT,
  ...PERSONAL_CONTENT,
  ...EDUCATION_CONTENT,
  ...EVENTS_CONTENT,
  ...MARKETING_CONTENT,
  ...LIFESTYLE_CONTENT,
};

export function getTemplateContent(slug: string): RichContent | undefined {
  return TEMPLATE_CONTENT[slug];
}
