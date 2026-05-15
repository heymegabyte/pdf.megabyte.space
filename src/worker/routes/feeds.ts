/**
 * Public RSS / JSON Feed / sitemap.xml routes.
 *
 * Mounted at the root in `src/worker/index.ts`, so each path here must also
 * appear in `wrangler.toml`'s `[assets].run_worker_first` list — otherwise
 * the Cloudflare Assets binding will intercept and serve the SPA shell.
 */
import { Hono } from "hono";
import { and, desc, eq, isNull, like, sql } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { Env, Variables } from "../types";
import { xmlEscape } from "../lib/xml-utils";

const feeds = new Hono<{ Bindings: Env; Variables: Variables }>();

interface FeedRow {
  slug: string | null;
  title: string;
  description: string | null;
  updatedAt: Date;
  createdAt: Date;
}

const loadFeedRows = async (
  db: ReturnType<typeof getDb>,
  tag: string | null
): Promise<FeedRow[]> => {
  try {
    const baseWhere = [eq(schema.projects.isPublic, true), isNull(schema.projects.deletedAt)];
    if (tag) baseWhere.push(like(sql`lower(${schema.projects.tags})`, `%${tag}%`));
    return await db
      .select({
        slug: schema.projects.slug,
        title: schema.projects.title,
        description: schema.projects.description,
        updatedAt: schema.projects.updatedAt,
        createdAt: schema.projects.createdAt,
      })
      .from(schema.projects)
      .where(and(...baseWhere))
      .orderBy(desc(schema.projects.updatedAt))
      .limit(50);
  } catch {
    return [];
  }
};

const parseTag = (raw: string | undefined): string | null =>
  (raw ?? "").trim().toLowerCase().slice(0, 40) || null;

feeds.get("/sitemap.xml", async (c) => {
  const db = getDb(c.env.DB);
  const origin = c.env.APP_URL ?? `${new URL(c.req.url).origin}`;
  const staticUrls = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/explore", priority: "0.9", changefreq: "daily" },
    { loc: "/sign-in", priority: "0.5", changefreq: "monthly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
  ];
  let publicProjects: { slug: string | null; updatedAt: Date }[] = [];
  try {
    publicProjects = await db
      .select({ slug: schema.projects.slug, updatedAt: schema.projects.updatedAt })
      .from(schema.projects)
      .where(and(eq(schema.projects.isPublic, true), isNull(schema.projects.deletedAt)))
      .limit(5000);
  } catch {
    // degrade to static-only
  }
  const today = new Date().toISOString().slice(0, 10);
  const entries: string[] = [];
  for (const u of staticUrls) {
    entries.push(
      `<url><loc>${xmlEscape(origin + u.loc)}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
    );
  }
  for (const p of publicProjects) {
    if (!p.slug) continue;
    const lastmod = new Date(p.updatedAt).toISOString().slice(0, 10);
    entries.push(
      `<url><loc>${xmlEscape(origin + "/c/" + p.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    );
  }
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    entries.join("") +
    `</urlset>`;
  return c.body(xml, 200, {
    "content-type": "application/xml; charset=utf-8",
    "cache-control": "public, max-age=1800",
  });
});

feeds.get("/feed.xml", async (c) => {
  const db = getDb(c.env.DB);
  const origin = c.env.APP_URL ?? `${new URL(c.req.url).origin}`;
  const tag = parseTag(c.req.query("tag"));
  const rows = await loadFeedRows(db, tag);
  const items = rows
    .filter((r) => r.slug)
    .map((r) => {
      const url = `${origin}/c/${r.slug}`;
      const ogUrl = `${origin}/s/og/${r.slug}.png`;
      const thumbUrl = `${origin}/s/thumb/${r.slug}.svg`;
      const pubDate = new Date(r.createdAt).toUTCString();
      return (
        `<item>` +
        `<title>${xmlEscape(r.title)}</title>` +
        `<link>${xmlEscape(url)}</link>` +
        `<guid isPermaLink="true">${xmlEscape(url)}</guid>` +
        `<pubDate>${pubDate}</pubDate>` +
        `<description>${xmlEscape(r.description ?? r.title)}</description>` +
        `<enclosure url="${xmlEscape(ogUrl)}" type="image/png" length="0" />` +
        `<media:thumbnail url="${xmlEscape(thumbUrl)}" width="800" height="600" />` +
        `<media:content url="${xmlEscape(ogUrl)}" medium="image" type="image/png" width="1200" height="630" />` +
        `</item>`
      );
    })
    .join("");
  const feedTitle = tag
    ? `Megabyte PDF — ${tag.charAt(0).toUpperCase()}${tag.slice(1)} PDFs`
    : `Megabyte PDF — Community feed`;
  const feedDesc = tag
    ? `Recently published community PDFs tagged "${tag}".`
    : `Recently published community PDFs.`;
  const feedHome = tag ? `${origin}/t/${tag}` : `${origin}/explore`;
  const feedSelf = tag ? `${origin}/feed.xml?tag=${tag}` : `${origin}/feed.xml`;
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/">` +
    `<channel>` +
    `<title>${xmlEscape(feedTitle)}</title>` +
    `<link>${xmlEscape(feedHome)}</link>` +
    `<atom:link href="${xmlEscape(feedSelf)}" rel="self" type="application/rss+xml" />` +
    `<description>${xmlEscape(feedDesc)}</description>` +
    `<language>en-us</language>` +
    `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>` +
    items +
    `</channel></rss>`;
  return c.body(xml, 200, {
    "content-type": "application/rss+xml; charset=utf-8",
    "cache-control": "public, max-age=900",
  });
});

feeds.get("/feed.json", async (c) => {
  const db = getDb(c.env.DB);
  const origin = c.env.APP_URL ?? `${new URL(c.req.url).origin}`;
  const tag = parseTag(c.req.query("tag"));
  const rows = await loadFeedRows(db, tag);
  const feedTitle = tag
    ? `Megabyte PDF — ${tag.charAt(0).toUpperCase()}${tag.slice(1)} PDFs`
    : `Megabyte PDF — Community feed`;
  return c.json(
    {
      version: "https://jsonfeed.org/version/1.1",
      title: feedTitle,
      home_page_url: tag ? `${origin}/t/${tag}` : `${origin}/explore`,
      feed_url: tag ? `${origin}/feed.json?tag=${tag}` : `${origin}/feed.json`,
      items: rows
        .filter((r) => r.slug)
        .map((r) => ({
          id: `${origin}/c/${r.slug}`,
          url: `${origin}/c/${r.slug}`,
          title: r.title,
          summary: r.description ?? r.title,
          date_published: new Date(r.createdAt).toISOString(),
          date_modified: new Date(r.updatedAt).toISOString(),
          image: `${origin}/s/og/${r.slug}.png`,
          banner_image: `${origin}/s/og/${r.slug}.png`,
          attachments: [
            {
              url: `${origin}/s/og/${r.slug}.png`,
              mime_type: "image/png",
              title: r.title,
            },
          ],
        })),
    },
    200,
    { "cache-control": "public, max-age=900" }
  );
});

export default feeds;
