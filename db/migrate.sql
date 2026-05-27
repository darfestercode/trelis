-- Run this against the student_network database to add new tables

-- Feed posts
CREATE TABLE IF NOT EXISTS posts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id  INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  tag_id   INTEGER REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Connections (peer connections between users)
CREATE TABLE IF NOT EXISTS connections (
  id           SERIAL PRIMARY KEY,
  requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(20) DEFAULT 'pending',  -- pending | accepted | declined
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester_id, recipient_id)
);

-- Project networks
CREATE TABLE IF NOT EXISTS networks (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS network_members (
  network_id  INTEGER REFERENCES networks(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id)    ON DELETE CASCADE,
  role        VARCHAR(50) DEFAULT 'member',
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (network_id, user_id)
);

-- Roles & permission system
CREATE TABLE IF NOT EXISTS network_roles (
  id          SERIAL PRIMARY KEY,
  network_id  INTEGER REFERENCES networks(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  color       VARCHAR(7)  DEFAULT '#99aab5',
  position    INTEGER     DEFAULT 0,
  is_everyone BOOLEAN     DEFAULT false,
  permissions INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS network_member_roles (
  network_id  INTEGER REFERENCES networks(id)       ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id)           ON DELETE CASCADE,
  role_id     INTEGER REFERENCES network_roles(id)   ON DELETE CASCADE,
  PRIMARY KEY (network_id, user_id, role_id)
);

-- Network channels & messages (must come before channel_permission_overrides)
CREATE TABLE IF NOT EXISTS network_channels (
  id         SERIAL PRIMARY KEY,
  network_id INTEGER REFERENCES networks(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channel_messages (
  id         SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES network_channels(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channel permission overrides (after both network_roles and network_channels)
CREATE TABLE IF NOT EXISTS channel_permission_overrides (
  channel_id  INTEGER REFERENCES network_channels(id) ON DELETE CASCADE,
  role_id     INTEGER REFERENCES network_roles(id)    ON DELETE CASCADE,
  allow       INTEGER DEFAULT 0,
  deny        INTEGER DEFAULT 0,
  PRIMARY KEY (channel_id, role_id)
);

-- Seed @everyone roles for any networks created before this migration
INSERT INTO network_roles (network_id, name, color, is_everyone, permissions, position)
SELECT id, '@everyone', '#99aab5', true, 3, 0
FROM networks n
WHERE NOT EXISTS (
  SELECT 1 FROM network_roles WHERE network_id = n.id AND is_everyone = true
);

-- Academic roadmap milestones
CREATE TABLE IF NOT EXISTS milestones (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Seed richer tag categories (institution, level, goals, skills)
-- Update existing categories if needed
INSERT INTO tags (name, category) VALUES
  ('Undergraduate', 'level'),
  ('Postgraduate',  'level'),
  ('PhD',           'level'),
  ('Tech Start Up Founder', 'goals'),
  ('Software Engineer',     'goals'),
  ('Research',              'goals'),
  ('Internship Ready',      'goals'),
  ('React',          'skills'),
  ('Next.js',        'skills'),
  ('Node.js',        'skills'),
  ('Python',         'skills'),
  ('Machine Learning','skills'),
  ('Public Speaking','skills'),
  ('Firebase',       'skills'),
  ('Data Science',   'skills')
ON CONFLICT DO NOTHING;
