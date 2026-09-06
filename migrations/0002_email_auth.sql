ALTER TABLE users ADD COLUMN passwordHash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email);
