-- Email automation: per-user preferences, send-dedup ledger, follow graph, milestone tracker.

ALTER TABLE `users` ADD `email_prefs` text NOT NULL DEFAULT '{"transactional":true,"product":true,"digest":true,"marketing":true,"community":true,"boost":true}';
ALTER TABLE `users` ADD `last_seen_at` integer;
ALTER TABLE `users` ADD `welcome_sent_at` integer;
ALTER TABLE `users` ADD `unsubscribe_token` text;
CREATE UNIQUE INDEX `users_unsub_token_idx` ON `users` (`unsubscribe_token`);
CREATE INDEX `users_last_seen_idx` ON `users` (`last_seen_at`);

-- Each row = one email send attempt. dedup_key prevents double-sending the same trigger event.
CREATE TABLE `email_events` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `template` text NOT NULL,
  `dedup_key` text NOT NULL,
  `status` text NOT NULL DEFAULT 'queued',
  `provider_id` text,
  `error` text,
  `payload` text,
  `sent_at` integer,
  `created_at` integer NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `email_events_dedup_idx` ON `email_events` (`dedup_key`);
CREATE INDEX `email_events_user_idx` ON `email_events` (`user_id`, `created_at`);
CREATE INDEX `email_events_template_idx` ON `email_events` (`template`, `created_at`);

-- Project view milestones (#6): records when a project first crosses 100/1k/10k views.
CREATE TABLE `project_milestones` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `milestone` integer NOT NULL,
  `created_at` integer NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `project_milestones_unique` ON `project_milestones` (`project_id`, `milestone`);

-- Follow graph (#12 New Follower notification).
CREATE TABLE `follows` (
  `id` text PRIMARY KEY NOT NULL,
  `follower_id` text NOT NULL,
  `following_id` text NOT NULL,
  `created_at` integer NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `follows_unique` ON `follows` (`follower_id`, `following_id`);
CREATE INDEX `follows_following_idx` ON `follows` (`following_id`, `created_at`);

-- Abandoned-prompt detection (#4): mark a chat draft as worth nudging.
ALTER TABLE `projects` ADD `last_prompt_at` integer;
ALTER TABLE `projects` ADD `last_render_at` integer;
CREATE INDEX `projects_abandoned_idx` ON `projects` (`last_prompt_at`, `last_render_at`);

-- Share-expiring detection (#11): nullable expiry on share links.
ALTER TABLE `share_links` ADD `expires_at` integer;
CREATE INDEX `share_expires_idx` ON `share_links` (`expires_at`);
