// Rich content extensions for blog posts and template hub entries.
// Adds: 300-1000 word richBody, APA citations, media gallery (Pexels + DALL-E + Google Image Search).

export interface APACitation {
  id: string;             // refId — e.g. "baymard-2024-line-length"
  apa: string;            // APA 7th-ed full reference string
  url?: string;           // deep-link to source
  type: "research" | "article" | "book" | "gov" | "spec" | "report";
}

export type RichBlock =
  | { type: "p"; text: string; cite?: string[] }       // optional inline APA refIds
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string; speaker?: string; cite?: string }
  | { type: "callout"; title: string; body: string }
  | { type: "stat"; value: string; label: string; cite?: string };

export interface MediaItem {
  source: "pexels" | "dalle" | "unsplash" | "google" | "wikimedia";
  kind: "photo" | "illustration" | "search-deeplink";
  src?: string;           // image URL when kind=photo|illustration
  href?: string;          // deep-link (Google Images search) when kind=search-deeplink
  alt: string;            // descriptive alt for a11y
  caption?: string;       // visible caption + attribution
  attribution: string;    // photographer or model name + license
  width?: number;
  height?: number;
}

export interface RichContent {
  richBody: RichBlock[];       // 300-1000 word article body
  citations: APACitation[];    // 2-3 minimum APA refs
  mediaGallery: MediaItem[];   // 3-4 items: 1 Pexels photo + 1 DALL-E illustration + 1 Google Image search deeplink (+ optional)
}
