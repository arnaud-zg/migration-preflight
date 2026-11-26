CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE users (id text PRIMARY KEY, email text NOT NULL);
--> statement-breakpoint
CREATE INDEX users_email_trgm_idx ON users USING gin (email gin_trgm_ops);
