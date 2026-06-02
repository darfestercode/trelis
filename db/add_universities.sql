-- Universities table (QS World Rankings via Apify actor)
CREATE TABLE IF NOT EXISTS universities (
  id                  SERIAL PRIMARY KEY,
  apify_id            TEXT UNIQUE,
  qs_rank             INTEGER,
  rank_display        VARCHAR(30),        -- e.g. "=5", "1001-1200"
  name                TEXT NOT NULL,
  country             TEXT,
  city                TEXT,
  overall_score       NUMERIC(6,2),
  academic_score      NUMERIC(6,2),       -- Academic Reputation
  employer_score      NUMERIC(6,2),       -- Employer Reputation
  citations_score     NUMERIC(6,2),       -- Citations per Faculty
  fac_student_score   NUMERIC(6,2),       -- Faculty/Student Ratio
  intl_faculty_score  NUMERIC(6,2),       -- International Faculty Ratio
  intl_students_score NUMERIC(6,2),       -- International Students Ratio
  logo_url            TEXT,
  profile_url         TEXT,
  synced_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_universities_rank    ON universities(qs_rank);
CREATE INDEX IF NOT EXISTS idx_universities_country ON universities(country);
CREATE INDEX IF NOT EXISTS idx_univ_name_search     ON universities USING gin(to_tsvector('english', name));

-- Track sync jobs
CREATE TABLE IF NOT EXISTS university_syncs (
  id            SERIAL PRIMARY KEY,
  apify_run_id  TEXT UNIQUE,
  status        VARCHAR(30) DEFAULT 'running',  -- running | completed | failed
  record_count  INTEGER DEFAULT 0,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  finished_at   TIMESTAMPTZ
);
