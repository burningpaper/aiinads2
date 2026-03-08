-- Migration 002: Feature additions
-- Comment moderation, show reset support, voting countdown

-- Add hidden column to comments for moderation
ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_comments_hidden ON comments(hidden);

-- Add countdown_seconds to decisions for voting timer
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS countdown_seconds INTEGER DEFAULT NULL;
