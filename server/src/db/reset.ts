import 'dotenv/config'
import { sql } from '../lib/db.js'

async function reset() {
  console.log('⚠️  Resetting database...')

  // Drop all tables
  await sql`
    DROP TABLE IF EXISTS ai_summaries CASCADE;
    DROP TABLE IF EXISTS comments CASCADE;
    DROP TABLE IF EXISTS votes CASCADE;
    DROP TABLE IF EXISTS decisions CASCADE;
    DROP TABLE IF EXISTS segment_content CASCADE;
    DROP TABLE IF EXISTS segments CASCADE;
    DROP TABLE IF EXISTS shows CASCADE;
    DROP TYPE IF EXISTS show_status CASCADE;
    DROP TYPE IF EXISTS segment_status CASCADE;
    DROP TYPE IF EXISTS decision_status CASCADE;
    DROP TYPE IF EXISTS content_type CASCADE;
    DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
  `

  console.log('Database reset complete!')
  console.log('Run "npm run db:migrate" to recreate tables')
  console.log('Run "npm run db:seed" to populate test data')
  process.exit(0)
}

reset().catch((err) => {
  console.error('Reset failed:', err)
  process.exit(1)
})
