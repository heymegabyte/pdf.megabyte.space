import { ExternalLink, ImageIcon, Quote as QuoteIcon } from "lucide-react";
import type { APACitation, MediaItem, RichBlock, RichContent } from "../data/rich-content";

interface Props {
  content: RichContent;
  eyebrow?: string;
  heading?: string;
}

export function RichContentSections({ content, eyebrow, heading }: Props) {
  const citationIndex = new Map<string, number>();
  content.citations.forEach((c, i) => citationIndex.set(c.id, i + 1));

  return (
    <>
      <RichBodySection
        blocks={content.richBody}
        citationIndex={citationIndex}
        eyebrow={eyebrow}
        heading={heading}
      />
      {content.mediaGallery.length > 0 && <MediaGallerySection items={content.mediaGallery} />}
      {content.citations.length > 0 && <ReferencesSection citations={content.citations} />}
    </>
  );
}

function RichBodySection({
  blocks,
  citationIndex,
  eyebrow,
  heading,
}: {
  blocks: RichBlock[];
  citationIndex: Map<string, number>;
  eyebrow?: string;
  heading?: string;
}) {
  if (blocks.length === 0) return null;
  return (
    <section className="border-b border-[var(--color-line)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        {eyebrow && (
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--color-cyan)] mb-3">
            {eyebrow}
          </div>
        )}
        {heading && (
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight mb-7"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {heading}
          </h2>
        )}
        <div>
          {blocks.map((b, i) => (
            <RichBlockRenderer key={i} block={b} citationIndex={citationIndex} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RichBlockRenderer({
  block,
  citationIndex,
}: {
  block: RichBlock;
  citationIndex: Map<string, number>;
}) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-[var(--color-fg)] leading-relaxed text-base mb-5">
          {block.text}
          {block.cite && block.cite.length > 0 && (
            <CitationSuperscripts ids={block.cite} citationIndex={citationIndex} />
          )}
        </p>
      );
    case "h2":
      return (
        <h2
          className="text-xl sm:text-2xl font-bold tracking-tight mt-10 mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {block.text}
        </h2>
      );
    case "h3":
      return <h3 className="text-lg font-semibold mt-7 mb-3">{block.text}</h3>;
    case "ul":
      return (
        <ul className="mb-6 space-y-2 list-disc list-outside pl-5">
          {block.items.map((it, i) => (
            <li key={i} className="text-[var(--color-fg)] leading-relaxed">
              {it}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mb-6 space-y-2 list-decimal list-outside pl-5">
          {block.items.map((it, i) => (
            <li key={i} className="text-[var(--color-fg)] leading-relaxed">
              {it}
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="my-7 border-l-2 border-[var(--color-cyan)] pl-5 italic text-[var(--color-muted)] leading-relaxed">
          <QuoteIcon
            size={14}
            aria-hidden="true"
            className="inline mr-1.5 -mt-1 text-[var(--color-cyan)]"
          />
          <span>{block.text}</span>
          {block.cite && (
            <CitationSuperscripts ids={[block.cite]} citationIndex={citationIndex} />
          )}
          {block.speaker && (
            <cite className="block mt-2 text-xs not-italic text-[var(--color-muted)]/80">
              — {block.speaker}
            </cite>
          )}
        </blockquote>
      );
    case "callout":
      return (
        <aside className="my-7 card p-5 border-l-2 border-[var(--color-cyan)]">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--color-cyan)] mb-2">
            {block.title}
          </div>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed">{block.body}</p>
        </aside>
      );
    case "stat":
      return (
        <div className="my-7 card p-6 grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-center">
          <div
            className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-cyan)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {block.value}
          </div>
          <div className="text-sm text-[var(--color-muted)] leading-relaxed">
            {block.label}
            {block.cite && (
              <CitationSuperscripts ids={[block.cite]} citationIndex={citationIndex} />
            )}
          </div>
        </div>
      );
  }
}

function CitationSuperscripts({
  ids,
  citationIndex,
}: {
  ids: string[];
  citationIndex: Map<string, number>;
}) {
  const numbers = ids.map((id) => citationIndex.get(id)).filter((n): n is number => Boolean(n));
  if (numbers.length === 0) return null;
  return (
    <>
      {numbers.map((n, i) => (
        <sup key={`${n}-${i}`} className="ml-0.5 text-[var(--color-cyan)]">
          <a
            href={`#ref-${n}`}
            className="hover:underline"
            aria-label={`Reference ${n}`}
          >
            [{n}]
          </a>
        </sup>
      ))}
    </>
  );
}

function MediaGallerySection({ items }: { items: MediaItem[] }) {
  return (
    <section className="border-b border-[var(--color-line)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-[var(--color-cyan)] mb-2">
              Inspiration board
            </div>
            <h2
              className="text-xl sm:text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Visual references that shaped this design
            </h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <MediaCard key={i} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MediaCard({ item }: { item: MediaItem }) {
  if (item.kind === "search-deeplink" && item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="card overflow-hidden group flex flex-col hover:border-[var(--color-cyan)]/60 transition-all"
      >
        <div
          aria-hidden="true"
          className="aspect-[4/3] grid place-items-center bg-gradient-to-br from-[var(--color-cyan)]/15 to-[#7C3AED]/15"
        >
          <ImageIcon size={36} className="text-[var(--color-cyan)]" aria-hidden="true" />
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-cyan)] mb-1.5">
            Google Images
          </div>
          <div className="font-semibold text-sm leading-tight mb-1.5 group-hover:text-[var(--color-cyan)] transition-colors">
            {item.caption ?? "More visual inspiration"}
          </div>
          <div className="mt-auto text-xs text-[var(--color-muted)] flex items-center gap-1.5">
            <span>Open search results</span>
            <ExternalLink size={12} aria-hidden="true" />
          </div>
        </div>
      </a>
    );
  }
  return (
    <figure className="card overflow-hidden flex flex-col">
      {item.src && (
        <div aria-hidden="true" className="aspect-[4/3] overflow-hidden bg-black/30">
          <img
            src={item.src}
            alt={item.alt}
            loading="lazy"
            decoding="async"
            width={item.width}
            height={item.height}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <figcaption className="p-4 flex-1 flex flex-col">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-cyan)] mb-1.5">
          {sourceLabel(item.source, item.kind)}
        </div>
        {item.caption && (
          <div className="font-semibold text-sm leading-tight mb-1.5">{item.caption}</div>
        )}
        <div className="mt-auto text-xs text-[var(--color-muted)] leading-relaxed">
          {item.attribution}
        </div>
      </figcaption>
    </figure>
  );
}

function sourceLabel(source: MediaItem["source"], kind: MediaItem["kind"]): string {
  if (kind === "illustration") {
    return `${source} · illustration`;
  }
  return source;
}

function ReferencesSection({ citations }: { citations: APACitation[] }) {
  return (
    <section className="border-b border-[var(--color-line)] bg-[var(--color-bg-elev)]/40">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
        <div className="text-xs uppercase tracking-[0.22em] text-[var(--color-cyan)] mb-3">
          References
        </div>
        <h2
          className="text-xl sm:text-2xl font-bold tracking-tight mb-5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Sources cited on this page
        </h2>
        <ol className="space-y-3">
          {citations.map((c, i) => {
            const n = i + 1;
            return (
              <li
                key={c.id}
                id={`ref-${n}`}
                className="text-sm text-[var(--color-muted)] leading-relaxed pl-8 -indent-8"
              >
                <span className="text-[var(--color-cyan)] mr-2">[{n}]</span>
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--color-cyan)] hover:underline"
                  >
                    {c.apa}
                  </a>
                ) : (
                  <span>{c.apa}</span>
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-6 text-xs text-[var(--color-muted)]/80">
          Citations follow APA 7th-edition format. Numbered links jump back into the body.
        </p>
      </div>
    </section>
  );
}
