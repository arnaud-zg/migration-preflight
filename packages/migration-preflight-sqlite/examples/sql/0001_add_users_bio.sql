ALTER TABLE users ADD COLUMN bio text;
--> statement-breakpoint
CREATE INDEX users_email_idx ON users (email);
