import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.resolve(__dirname, '../../../db/migrations')

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  console.log('Running migrations...')

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    console.log(`  Running: ${file}`)
    const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8')

    try {
      // Split by semicolons and run each statement
      const statements = sqlContent
        .split(/;\s*$/m)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)

      for (const statement of statements) {
        await sql(statement)
      }
      console.log(`  ✓ ${file}`)
    } catch (error) {
      const errorMsg = (error as Error).message
      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
        console.log(`  ⊘ ${file} (already applied)`)
      } else {
        throw error
      }
    }
  }

  console.log('Migrations complete!')
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
