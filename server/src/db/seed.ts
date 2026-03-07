import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const seedFile = path.resolve(__dirname, '../../../db/seed.sql')

async function seed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is required')
    process.exit(1)
  }

  const sql = neon(databaseUrl)

  console.log('Seeding database...')

  const sqlContent = fs.readFileSync(seedFile, 'utf8')

  // Remove standalone comment lines and split by semicolons
  const cleanedSql = sqlContent
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

  const statements = cleanedSql
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const statement of statements) {
    await sql(statement)
  }

  console.log('Database seeded successfully!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
