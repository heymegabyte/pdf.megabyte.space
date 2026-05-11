CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `name` text,
  `image_url` text,
  `plan` text DEFAULT 'free' NOT NULL,
  `stripe_customer_id` text,
  `stripe_subscription_id` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
CREATE TABLE `projects` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `title` text DEFAULT 'Untitled PDF' NOT NULL,
  `html` text DEFAULT '' NOT NULL,
  `css` text DEFAULT '' NOT NULL,
  `page_size` text DEFAULT 'Letter' NOT NULL,
  `margin` text DEFAULT '0.75in' NOT NULL,
  `deleted_at` integer,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `projects_user_idx` ON `projects` (`user_id`,`deleted_at`);
--> statement-breakpoint
CREATE TABLE `turns` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `role` text NOT NULL,
  `content` text NOT NULL,
  `model` text,
  `input_tokens` integer,
  `output_tokens` integer,
  `cache_read_tokens` integer,
  `cache_write_tokens` integer,
  `snapshot_id` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `turns_project_idx` ON `turns` (`project_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `snapshots` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `label` text,
  `html` text NOT NULL,
  `css` text NOT NULL,
  `page_size` text NOT NULL,
  `margin` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `snapshots_project_idx` ON `snapshots` (`project_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `share_links` (
  `slug` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `snapshot_id` text,
  `views` integer DEFAULT 0 NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `share_project_idx` ON `share_links` (`project_id`);
--> statement-breakpoint
CREATE TABLE `exports` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL,
  `r2_key` text NOT NULL,
  `bytes` integer NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade
);
