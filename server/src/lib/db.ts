import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

export const sql = neon(databaseUrl)

// Helper to convert snake_case to camelCase
export function toCamelCase<T extends Record<string, unknown>>(row: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result as T
}

// Helper to convert array of rows
export function rowsToCamelCase<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.map(toCamelCase)
}
