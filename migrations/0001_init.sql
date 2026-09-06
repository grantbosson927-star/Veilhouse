CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openId TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  loginMethod TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  lastSignedIn INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS curator_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  authorId INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  story TEXT NOT NULL,
  imageUrl TEXT,
  videoUrl TEXT,
  imageKey TEXT,
  videoKey TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduleCronTaskUid TEXT,
  scheduledFor INTEGER,
  publishedAt INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS curator_post_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  postId INTEGER NOT NULL,
  authorId INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  story TEXT NOT NULL,
  imageUrl TEXT,
  videoUrl TEXT,
  status TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS curator_settings (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS curator_specimens (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT,
  story TEXT,
  imageUrl TEXT,
  videoUrl TEXT,
  imageKey TEXT,
  videoKey TEXT,
  heroMedia TEXT NOT NULL DEFAULT 'image',
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS curator_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  imageUrl TEXT,
  imageKey TEXT,
  recipient TEXT NOT NULL DEFAULT 'curator@veilhouse.monster',
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'dispatch',
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS dream_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  dreamText TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);

INSERT OR IGNORE INTO curator_settings (id, email, updatedAt)
VALUES (1, 'brilliantelay5@gmail.com', strftime('%s', 'now'));
