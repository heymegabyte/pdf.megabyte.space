import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    imageUrl: text("image_url"),
    googleSub: text("google_sub").unique(),
    googleRefreshToken: text("google_refresh_token"),
    googleAccessToken: text("google_access_token"),
    googleAccessTokenExpiresAt: integer("google_access_token_expires_at", { mode: "timestamp_ms" }),
    plan: text("plan", { enum: ["free", "pro"] }).notNull().default("free"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    editCredits: integer("edit_credits").notNull().default(0),
    lastCreditGrantAt: integer("last_credit_grant_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index("users_stripe_customer_idx").on(t.stripeCustomerId),
    index("users_google_sub_idx").on(t.googleSub),
  ]
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("sessions_user_idx").on(t.userId)]
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Untitled PDF"),
    html: text("html").notNull().default(""),
    css: text("css").notNull().default(""),
    pageSize: text("page_size").notNull().default("Letter"),
    margin: text("margin").notNull().default("0.75in"),
    slug: text("slug"),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
    viewCount: integer("view_count").notNull().default(0),
    editCount: integer("edit_count").notNull().default(0),
    aiTitleGenerated: integer("ai_title_generated", { mode: "boolean" }).notNull().default(false),
    description: text("description"),
    tags: text("tags"),
    thumbnailKey: text("thumbnail_key"),
    presentMode: integer("present_mode", { mode: "boolean" }).notNull().default(false),
    lastIndexedAt: integer("last_indexed_at", { mode: "timestamp_ms" }),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [
    index("projects_user_idx").on(t.userId, t.deletedAt),
    uniqueIndex("projects_slug_unique").on(t.slug),
    index("projects_public_idx").on(t.isPublic, t.updatedAt),
  ]
);

export const turns = sqliteTable(
  "turns",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    model: text("model"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    cacheReadTokens: integer("cache_read_tokens"),
    cacheWriteTokens: integer("cache_write_tokens"),
    snapshotId: text("snapshot_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("turns_project_idx").on(t.projectId, t.createdAt)]
);

export const snapshots = sqliteTable(
  "snapshots",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    label: text("label"),
    html: text("html").notNull(),
    css: text("css").notNull(),
    pageSize: text("page_size").notNull(),
    margin: text("margin").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("snapshots_project_idx").on(t.projectId, t.createdAt)]
);

export const shareLinks = sqliteTable(
  "share_links",
  {
    slug: text("slug").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    snapshotId: text("snapshot_id"),
    views: integer("views").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("share_project_idx").on(t.projectId)]
);

export const exports = sqliteTable("exports", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  r2Key: text("r2_key").notNull(),
  bytes: integer("bytes").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Turn = typeof turns.$inferSelect;
export type Snapshot = typeof snapshots.$inferSelect;
export type ShareLink = typeof shareLinks.$inferSelect;
