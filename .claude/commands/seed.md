# /seed - Database Seed Command

Generate or run seed data for the AI in Advertising conference system.

## Arguments
- `$ARGUMENTS` - Optional: "generate" to create seed file, "run" to execute, or custom show title

## Instructions

### If "generate" or no arguments:
Create/update seed file at `db/seed.sql` with:

```sql
-- Clear existing data (dev only)
TRUNCATE shows, segments, segment_content, decisions, votes, comments, ai_summaries CASCADE;

-- Create show
INSERT INTO shows (id, title, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'AI in Advertising 2025', 'setup');

-- Create 5 segments
INSERT INTO segments (id, show_id, order_index, title, status) VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 1, 'The Brief', 'draft'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 2, 'Target Audience', 'draft'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 3, 'Creative Strategy', 'draft'),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 4, 'Media Plan', 'draft'),
  ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 5, 'The Pitch', 'draft');

-- Create decisions (one per segment)
INSERT INTO decisions (id, segment_id, question, option_a, option_b, status) VALUES
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000011', 'Should we target a broad or niche audience?', 'Broad reach', 'Niche focus', 'pending'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000012', 'Which demographic should we prioritize?', 'Gen Z', 'Millennials', 'pending'),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000013', 'What creative approach?', 'Bold & disruptive', 'Warm & relatable', 'pending'),
  ('00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000014', 'Primary channel focus?', 'Social-first', 'TV + Digital', 'pending'),
  ('00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000015', 'Final pitch style?', 'Data-driven', 'Emotion-led', 'pending');

-- Sample content for first segment
INSERT INTO segment_content (segment_id, content_type, content_value, display_order) VALUES
  ('00000000-0000-0000-0000-000000000011', 'text', '# Welcome to the AI in Advertising Experience\n\nToday, you will help shape a real advertising campaign.', 1),
  ('00000000-0000-0000-0000-000000000011', 'text', 'Our client needs your input on key strategic decisions.', 2);
```

### If "run":
Execute the seed file against the database:
```bash
cd server && npm run db:seed
```

## Predictable IDs

Use deterministic UUIDs for easier testing:
- Show: `00000000-0000-0000-0000-000000000001`
- Segments: `00000000-0000-0000-0000-00000000001{1-5}`
- Decisions: `00000000-0000-0000-0000-00000000002{1-5}`

## Output

Generate the seed SQL file or run the seeding command based on arguments.
