import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

// Dynamically install pg if not present
try {
  import('pg')
} catch (e) {
  console.log('Installing pg client...')
  execSync('npm install pg', { stdio: 'inherit' })
}

const pg = await import('pg')
const { Client } = pg.default

const dbPassword = 'Password123!'
const connStr = `postgresql://postgres.menmpyyrqevonepbpfai:${dbPassword}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`

console.log('Connecting to database...')
const client = new Client({ connectionString: connStr })

try {
  await client.connect()
  console.log('Successfully connected to database!')
  
  const migrationSql = fs.readFileSync(
    'c:/Users/USER/Downloads/app-eventgrid/supabase/migrations/072_fix_profiles_role_check.sql',
    'utf8'
  )
  
  console.log('Executing migration 072...')
  await client.query(migrationSql)
  console.log('Migration executed successfully!')
} catch (err) {
  console.error('Database connection or execution failed:', err.message)
} finally {
  await client.end()
}
