-- ============================================================
-- TRELIS — Full Schema
-- Run this first on a fresh database, then migrate.sql, then seed.sql
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id                SERIAL PRIMARY KEY,
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     TEXT NOT NULL,
  name              VARCHAR(255) NOT NULL,
  university        VARCHAR(255),
  major             VARCHAR(255),
  year              INTEGER,
  country           VARCHAR(100),
  bio               TEXT,
  profile_photo_url TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Tags (skills, levels, goals, etc.)
CREATE TABLE IF NOT EXISTS tags (
  id       SERIAL PRIMARY KEY,
  name     VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL
);

-- User ↔ Tag junction
CREATE TABLE IF NOT EXISTS user_tags (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tag_id  INTEGER REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (user_id, tag_id)
);

-- Direct messages
CREATE TABLE IF NOT EXISTS messages (
  id           SERIAL PRIMARY KEY,
  sender_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Seed base tags
INSERT INTO tags (name, category) VALUES
  ('Australia',    'country'),
  ('USA',          'country'),
  ('UK',           'country'),
  ('India',        'country'),
  ('Canada',       'country'),
  ('RMIT',         'institution'),
  ('Monash',       'institution'),
  ('UNSW',         'institution'),
  ('Melbourne Uni','institution'),
  ('Sydney Uni',   'institution')
ON CONFLICT (name) DO NOTHING;
