# /migrate - Neon Database Migration Generator

Generate a SQL migration file for the AI in Advertising conference system.

## Arguments
- `$ARGUMENTS` - Description of what to migrate (e.g., "create votes table", "add status column to shows")

## Instructions

1. Generate a timestamped migration file at `db/migrations/{timestamp}_{name}.sql`
2. Follow these patterns:

### Table Creation
```sql
CREATE TABLE IF NOT EXISTS table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index commonly queried columns
CREATE INDEX idx_table_name_column ON table_name(column);
```

### Enums
```sql
CREATE TYPE status_enum AS ENUM ('draft', 'live', 'complete');
```

### Foreign Keys
```sql
REFERENCES other_table(id) ON DELETE CASCADE
```

### Constraints
```sql
CONSTRAINT unique_vote UNIQUE (decision_id, audience_session_id)
```

## Project Schema Reference

Core tables: `shows`, `segments`, `segment_content`, `decisions`, `votes`, `comments`, `ai_summaries`

Key enums:
- show_status: `setup`, `live`, `closed`
- segment_status: `draft`, `live`, `complete`
- decision_status: `pending`, `open`, `closed`
- content_type: `text`, `image`, `youtube`, `pdf`

## Output

Create the migration file and provide the SQL content. Name format: `{YYYYMMDDHHMMSS}_{descriptive_name}.sql`
