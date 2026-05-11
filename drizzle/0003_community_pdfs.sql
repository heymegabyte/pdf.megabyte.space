-- Community PDFs pivot: public sharing, AI titles, edit credits, present mode.
ALTER TABLE `projects` ADD `slug` text;
ALTER TABLE `projects` ADD `is_public` integer NOT NULL DEFAULT 0;
ALTER TABLE `projects` ADD `view_count` integer NOT NULL DEFAULT 0;
ALTER TABLE `projects` ADD `edit_count` integer NOT NULL DEFAULT 0;
ALTER TABLE `projects` ADD `ai_title_generated` integer NOT NULL DEFAULT 0;
ALTER TABLE `projects` ADD `description` text;
ALTER TABLE `projects` ADD `tags` text;
ALTER TABLE `projects` ADD `thumbnail_key` text;
ALTER TABLE `projects` ADD `present_mode` integer NOT NULL DEFAULT 0;
ALTER TABLE `projects` ADD `last_indexed_at` integer;

CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);
CREATE INDEX `projects_public_idx` ON `projects` (`is_public`, `updated_at`);

ALTER TABLE `users` ADD `edit_credits` integer NOT NULL DEFAULT 0;
ALTER TABLE `users` ADD `last_credit_grant_at` integer;
