-- Add panel title fields to segments
-- These are displayed on the presentation screen after voting closes

ALTER TABLE segments ADD COLUMN IF NOT EXISTS panel_title TEXT;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS panel_participants TEXT;
