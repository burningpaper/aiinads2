-- Add flag to explicitly enable mini-site display for a show
ALTER TABLE shows ADD COLUMN IF NOT EXISTS show_mini_site BOOLEAN NOT NULL DEFAULT false;
