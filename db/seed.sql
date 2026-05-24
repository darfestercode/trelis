-- =============================================================
-- TRELIS DUMMY DATA SEED
-- Password for all demo users: Demo1234!
-- Run AFTER the initial schema and migrate.sql
-- =============================================================

-- Demo users
INSERT INTO users (email, password_hash, name, university, major, year, country, bio) VALUES
  ('sarah@student.edu',  '$2b$10$mPq5JG/EHsmYhzDBmqqA9.QSzDhY71SIqI4Zwmtj7KK23mY/RmJBy', 'Sarah Khan',   'RMIT University',          'Computer Science',       1, 'Australia',
   'Passionate CS undergrad with a love for open-source projects and hackathons. Currently building a study-group matching app and looking for co-founders who share the same obsession with clean code.'),
  ('alex@student.edu',   '$2b$10$mPq5JG/EHsmYhzDBmqqA9.QSzDhY71SIqI4Zwmtj7KK23mY/RmJBy', 'Alex Chen',    'Monash University',        'Business Administration',5, 'Australia',
   'Postgrad business student turned tech entrepreneur. Just closed my first angel round for a SaaS B2B analytics tool. Always happy to chat startup strategy, fundraising, and growth hacking.'),
  ('james@student.edu',  '$2b$10$mPq5JG/EHsmYhzDBmqqA9.QSzDhY71SIqI4Zwmtj7KK23mY/RmJBy', 'James Lee',    'University of New South Wales','Data Science',          6, 'Australia',
   'PhD candidate researching explainability in large language models. 3 publications. Looking for collaborators on a new NLP benchmark dataset — DM me if you work in interpretable ML.'),
  ('priya@student.edu',  '$2b$10$mPq5JG/EHsmYhzDBmqqA9.QSzDhY71SIqI4Zwmtj7KK23mY/RmJBy', 'Priya Sharma', 'University of Melbourne',  'Biotechnology',          2, 'India',
   'Undergrad biotech student fascinated by the intersection of AI and drug discovery. Currently volunteering in a computational biology lab and preparing for grad school applications.')
ON CONFLICT (email) DO NOTHING;

-- ---- Tag assignments ----
-- Sarah: React, Next.js, Undergraduate, Software Engineer, Internship Ready
INSERT INTO user_tags (user_id, tag_id)
SELECT u.id, t.id FROM users u, tags t
WHERE u.email = 'sarah@student.edu'
  AND t.name IN ('React', 'Next.js', 'Undergraduate', 'Software Engineer', 'Internship Ready', 'Public Speaking')
ON CONFLICT DO NOTHING;

-- Alex: Tech Start Up Founder, Postgraduate, Machine Learning, Firebase
INSERT INTO user_tags (user_id, tag_id)
SELECT u.id, t.id FROM users u, tags t
WHERE u.email = 'alex@student.edu'
  AND t.name IN ('Tech Start Up Founder', 'Postgraduate', 'Firebase', 'Machine Learning', 'Node.js')
ON CONFLICT DO NOTHING;

-- James: PhD, Machine Learning, Python, Data Science, Research
INSERT INTO user_tags (user_id, tag_id)
SELECT u.id, t.id FROM users u, tags t
WHERE u.email = 'james@student.edu'
  AND t.name IN ('PhD', 'Machine Learning', 'Python', 'Data Science', 'Research')
ON CONFLICT DO NOTHING;

-- Priya: Undergraduate, Python, Machine Learning, Research
INSERT INTO user_tags (user_id, tag_id)
SELECT u.id, t.id FROM users u, tags t
WHERE u.email = 'priya@student.edu'
  AND t.name IN ('Undergraduate', 'Python', 'Machine Learning', 'Research', 'Data Science')
ON CONFLICT DO NOTHING;

-- ---- Feed Posts ----
INSERT INTO posts (user_id, content, created_at) VALUES
  ((SELECT id FROM users WHERE email = 'sarah@student.edu'),
   'Looking for an accountability partner for Data Structures this semester. My goal is to finish the syllabus 2 weeks early so I can prep for internship interviews. Anyone in Melbourne up for weekly Zoom check-ins? 🎯',
   NOW() - INTERVAL '2 hours'),
  ((SELECT id FROM users WHERE email = 'alex@student.edu'),
   'Just finalized my pitch deck for the university incubator! Looking for someone with a technical background to review my proposed architecture. Happy to swap feedback on business models too. Coffee is on me ☕️',
   NOW() - INTERVAL '5 hours'),
  ((SELECT id FROM users WHERE email = 'james@student.edu'),
   'Paper accepted at EMNLP! 🎉 "Towards Faithful Explanations for Text Classification with Robustness Improvement" — first-authored work on my PhD thesis. Huge thanks to my supervisor and lab mates. Now on to chapter 3...',
   NOW() - INTERVAL '1 day'),
  ((SELECT id FROM users WHERE email = 'priya@student.edu'),
   'First week volunteering in the Computational Biology lab done! Working with protein folding datasets. If anyone knows good resources for learning bioinformatics pipelines from a software background, please share below! 🧬',
   NOW() - INTERVAL '3 days'),
  ((SELECT id FROM users WHERE email = 'sarah@student.edu'),
   'Shipped my first open-source contribution! Fixed a longstanding accessibility bug in a popular React component library. Small win, but it feels amazing to give back to the community that taught me everything. ✨',
   NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- ---- Post Tags ----
INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t, users u
WHERE u.email = 'sarah@student.edu'
  AND p.user_id = u.id
  AND p.content LIKE '%accountability partner%'
  AND t.name IN ('Undergraduate', 'Software Engineer', 'Internship Ready')
ON CONFLICT DO NOTHING;

INSERT INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p, tags t, users u
WHERE u.email = 'alex@student.edu'
  AND p.user_id = u.id
  AND t.name IN ('Tech Start Up Founder', 'Postgraduate')
ON CONFLICT DO NOTHING;

-- ---- Connections (accepted) ----
INSERT INTO connections (requester_id, recipient_id, status) VALUES
  ((SELECT id FROM users WHERE email = 'sarah@student.edu'),
   (SELECT id FROM users WHERE email = 'alex@student.edu'), 'accepted'),
  ((SELECT id FROM users WHERE email = 'james@student.edu'),
   (SELECT id FROM users WHERE email = 'sarah@student.edu'), 'accepted'),
  ((SELECT id FROM users WHERE email = 'priya@student.edu'),
   (SELECT id FROM users WHERE email = 'james@student.edu'), 'accepted'),
  ((SELECT id FROM users WHERE email = 'alex@student.edu'),
   (SELECT id FROM users WHERE email = 'james@student.edu'), 'accepted')
ON CONFLICT (requester_id, recipient_id) DO NOTHING;

-- ---- Networks ----
INSERT INTO networks (name, description, creator_id) VALUES
  ('CS Study Group @ RMIT',
   'Weekly problem-solving sessions focused on algorithms, system design, and interview prep. Open to all RMIT CS students. We meet Thursdays at 6pm.',
   (SELECT id FROM users WHERE email = 'sarah@student.edu')),
  ('AI & ML Research Circle',
   'A cross-university group for grad students and researchers working on ML. We share papers, run reading groups, and collaborate on benchmark datasets.',
   (SELECT id FROM users WHERE email = 'james@student.edu')),
  ('Startup Founders Network',
   'For student entrepreneurs at Australian universities. Monthly pitch nights, investor intros, and co-founder matching. Stage-agnostic — idea to Series A.',
   (SELECT id FROM users WHERE email = 'alex@student.edu'))
ON CONFLICT DO NOTHING;

-- ---- Network Members ----
INSERT INTO network_members (network_id, user_id, role) VALUES
  ((SELECT id FROM networks WHERE name = 'CS Study Group @ RMIT'),
   (SELECT id FROM users WHERE email = 'sarah@student.edu'), 'admin'),
  ((SELECT id FROM networks WHERE name = 'CS Study Group @ RMIT'),
   (SELECT id FROM users WHERE email = 'priya@student.edu'), 'member'),

  ((SELECT id FROM networks WHERE name = 'AI & ML Research Circle'),
   (SELECT id FROM users WHERE email = 'james@student.edu'), 'admin'),
  ((SELECT id FROM networks WHERE name = 'AI & ML Research Circle'),
   (SELECT id FROM users WHERE email = 'priya@student.edu'), 'member'),
  ((SELECT id FROM networks WHERE name = 'AI & ML Research Circle'),
   (SELECT id FROM users WHERE email = 'alex@student.edu'), 'member'),

  ((SELECT id FROM networks WHERE name = 'Startup Founders Network'),
   (SELECT id FROM users WHERE email = 'alex@student.edu'), 'admin'),
  ((SELECT id FROM networks WHERE name = 'Startup Founders Network'),
   (SELECT id FROM users WHERE email = 'sarah@student.edu'), 'member')
ON CONFLICT DO NOTHING;

-- ---- Milestones for Sarah (as a demo of a completed roadmap) ----
INSERT INTO milestones (user_id, title, description, is_completed, completed_at, created_at) VALUES
  ((SELECT id FROM users WHERE email = 'sarah@student.edu'),
   'Complete Data Structures module', 'Cover arrays, linked lists, trees, and graphs end-to-end.',
   true,  NOW() - INTERVAL '20 days', NOW() - INTERVAL '45 days'),
  ((SELECT id FROM users WHERE email = 'sarah@student.edu'),
   'Submit 5 internship applications', 'Target companies: Atlassian, Canva, Buildkite, Culture Amp, Envato.',
   true,  NOW() - INTERVAL '10 days', NOW() - INTERVAL '30 days'),
  ((SELECT id FROM users WHERE email = 'sarah@student.edu'),
   'Build capstone project MVP', 'Study-group matching app with tag-based recommendations.',
   false, NULL,                       NOW() - INTERVAL '14 days'),
  ((SELECT id FROM users WHERE email = 'sarah@student.edu'),
   'Attend TechConnect Melbourne conference', 'Network with engineers and attend the ML/AI track sessions.',
   false, NULL,                       NOW() - INTERVAL '7 days'),

-- Milestones for James
  ((SELECT id FROM users WHERE email = 'james@student.edu'),
   'Submit EMNLP paper', 'First-author paper on LLM explanation faithfulness.',
   true,  NOW() - INTERVAL '5 days', NOW() - INTERVAL '90 days'),
  ((SELECT id FROM users WHERE email = 'james@student.edu'),
   'Complete literature review for chapter 3', 'Cover interpretability methods: SHAP, LIME, Integrated Gradients.',
   false, NULL,                       NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;
