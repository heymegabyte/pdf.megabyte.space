-- Replace Clerk auth with native Google OAuth + cookie sessions.
ALTER TABLE `users` ADD `google_sub` text;
ALTER TABLE `users` ADD `google_refresh_token` text;
ALTER TABLE `users` ADD `google_access_token` text;
ALTER TABLE `users` ADD `google_access_token_expires_at` integer;
ALTER TABLE `users` ADD `updated_at` integer NOT NULL DEFAULT (unixepoch() * 1000);
CREATE UNIQUE INDEX `users_google_sub_unique` ON `users` (`google_sub`);
CREATE INDEX `users_google_sub_idx` ON `users` (`google_sub`);

CREATE TABLE `sessions` (
    `id` text PRIMARY KEY NOT NULL,
    `user_id` text NOT NULL,
    `expires_at` integer NOT NULL,
    `created_at` integer NOT NULL DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);
