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
