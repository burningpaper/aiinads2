-- Add segment display mode options
-- decision_enabled: when false, voting is disabled for this segment (content only)
-- title_only: when true, segment shows panel title immediately (no content or voting)

ALTER TABLE segments ADD COLUMN IF NOT EXISTS decision_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS title_only BOOLEAN NOT NULL DEFAULT false;
