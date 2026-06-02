-- Run in Supabase SQL Editor before deploying this version
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url  TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(20);  -- 'image' | 'video' | 'file' | 'code'
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;

ALTER TABLE posts ADD COLUMN IF NOT EXISTS attachment_url  TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(20);  -- 'image' | 'video' | 'file' | 'code'
