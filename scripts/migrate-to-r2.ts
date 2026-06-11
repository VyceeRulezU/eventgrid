/**
 * Migration script: Copy all existing files from Supabase Storage to R2.
 *
 * Usage:
 *   1. npx tsx scripts/migrate-to-r2.ts
 *
 * Reads config from .env.local automatically (VITE_R2_* + VITE_SUPABASE_* vars).
 * Requires SUPABASE_SERVICE_ROLE_KEY in environment (for admin DB access).
 *
 * What it does:
 *   - Queries all tables with storage references
 *   - Downloads each file from Supabase Storage
 *   - Uploads to R2 at the same path
 *   - Updates the DB record with the new R2 URL
 */

import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import path from 'path'
import fs from 'fs'

// ── Load .env.local manually ──────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(import.meta.dirname, '..', '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1)
    process.env[key] = value
  }
}
loadEnv()

// ── Config ────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.VITE_SUPABASE_URL!
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
const R2_ENDPOINT       = process.env.VITE_R2_ENDPOINT!
const R2_BUCKET         = process.env.VITE_R2_BUCKET!
const R2_ACCESS_KEY_ID  = process.env.VITE_R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.VITE_R2_SECRET_ACCESS_KEY!
const R2_PUBLIC_URL     = process.env.VITE_R2_PUBLIC_URL!

const SUPABASE_PUBLIC = `${SUPABASE_URL}/storage/v1/object/public`

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  forcePathStyle: true,
})

// ── Helpers ───────────────────────────────────────────────────────

function parseSupabaseUrl(url: string): { bucket: string; path: string } | null {
  if (typeof url !== 'string' || !url.startsWith(SUPABASE_PUBLIC)) return null
  const rest = url.slice(SUPABASE_PUBLIC.length + 1)
  const slash = rest.indexOf('/')
  if (slash === -1) return null
  return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) }
}

async function downloadFromSupabase(bucket: string, filePath: string): Promise<Buffer | null> {
  const url = `${SUPABASE_PUBLIC}/${bucket}/${filePath}`
  try {
    const res = await fetch(url)
    if (!res.ok) { console.error(`  ⚠ Download failed (${res.status}): ${url}`); return null }
    return Buffer.from(await res.arrayBuffer())
  } catch (err) { console.error(`  ⚠ Download error: ${url}`); return null }
}

async function uploadToR2(filePath: string, data: Buffer, contentType: string): Promise<string | null> {
  try {
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: filePath,
      Body: data,
      ContentType: contentType,
    }))
    return `${R2_PUBLIC_URL}/${filePath}`
  } catch (err) {
    console.error(`  ⚠ R2 upload error: ${filePath} — ${(err as Error).message}`)
    return null
  }
}

function contentTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf', '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain', '.csv': 'text/csv',
    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
    '.zip': 'application/zip', '.rar': 'application/vnd.rar',
    '.json': 'application/json',
  }
  return map[ext] || 'application/octet-stream'
}

async function migrateFile(supabaseUrl: string): Promise<string | null> {
  if (!supabaseUrl || supabaseUrl.startsWith(R2_PUBLIC_URL)) return supabaseUrl
  const parsed = parseSupabaseUrl(supabaseUrl)
  if (!parsed) { console.error(`  ⚠ Cannot parse URL: ${supabaseUrl}`); return null }
  const data = await downloadFromSupabase(parsed.bucket, parsed.path)
  if (!data) return null
  return uploadToR2(parsed.path, data, contentTypeFromPath(parsed.path))
}

async function migrateFileArray(urls: string[]): Promise<string[]> {
  const result: string[] = []
  for (const url of urls) {
    const newUrl = url.startsWith(R2_PUBLIC_URL) ? url : (await migrateFile(url) || url)
    result.push(newUrl)
  }
  return result
}

// ── Migration ─────────────────────────────────────────────────────

async function migrate() {
  console.log('Starting R2 migration...\n')
  let total = 0, succeeded = 0

  // 1. profiles.avatar_url
  console.log('── profiles (avatar_url) ──')
  const { data: profiles } = await supabase.from('profiles').select('id, avatar_url').not('avatar_url', 'is', null)
  for (const row of profiles || []) {
    if (!row.avatar_url) continue
    console.log(`  Migrating avatar for user ${row.id}...`)
    const newUrl = await migrateFile(row.avatar_url)
    if (newUrl) { await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', row.id); succeeded++ }
    total++
  }

  // 2. organizations.logo_url
  console.log('\n── organizations (logo_url) ──')
  const { data: orgs } = await supabase.from('organizations').select('id, logo_url').not('logo_url', 'is', null)
  for (const row of orgs || []) {
    if (!row.logo_url) continue
    console.log(`  Migrating logo for org ${row.id}...`)
    const newUrl = await migrateFile(row.logo_url)
    if (newUrl) { await supabase.from('organizations').update({ logo_url: newUrl }).eq('id', row.id); succeeded++ }
    total++
  }

  // 3. media.url
  console.log('\n── media (url) ──')
  const { data: mediaRows } = await supabase.from('media').select('id, url').not('url', 'is', null)
  for (const row of mediaRows || []) {
    if (!row.url) continue
    const newUrl = await migrateFile(row.url)
    if (newUrl) { await supabase.from('media').update({ url: newUrl }).eq('id', row.id); succeeded++ }
    total++
  }

  /** Safely parse a JSON array column that may come as a string or already parsed */
  function parseJsonArray(val: unknown): string[] {
    if (Array.isArray(val)) return val
    if (typeof val === 'string') try { return JSON.parse(val) } catch { return [] }
    return []
  }

  // 4. task_comments.photo_urls (JSON array)
  console.log('\n── task_comments (photo_urls) ──')
  const { data: taskComments } = await supabase.from('task_comments').select('id, photo_urls').not('photo_urls', 'is', null)
  for (const row of taskComments || []) {
    const urls = parseJsonArray(row.photo_urls)
    if (!urls.length) continue
    const newUrls = await migrateFileArray(urls)
    const changed = urls.some((u, i) => u !== newUrls[i])
    if (changed) { await supabase.from('task_comments').update({ photo_urls: JSON.stringify(newUrls) }).eq('id', row.id) }
    succeeded++; total++
  }

  // 5. live_feed_posts.photo_urls (JSON array)
  console.log('\n── live_feed_posts (photo_urls) ──')
  const { data: feedPosts } = await supabase.from('live_feed_posts').select('id, photo_urls').not('photo_urls', 'is', null)
  for (const row of feedPosts || []) {
    const urls = parseJsonArray(row.photo_urls)
    if (!urls.length) continue
    const newUrls = await migrateFileArray(urls)
    const changed = urls.some((u, i) => u !== newUrls[i])
    if (changed) { await supabase.from('live_feed_posts').update({ photo_urls: JSON.stringify(newUrls) }).eq('id', row.id) }
    succeeded++; total++
  }

  // 6. feedback_messages.attachment_url (stored as path, not full URL)
  console.log('\n── feedback_messages (attachment_url) ──')
  const { data: feedbackMsgs } = await supabase.from('feedback_messages').select('id, attachment_url').not('attachment_url', 'is', null)
  for (const row of feedbackMsgs || []) {
    if (!row.attachment_url) continue
    const filePath = row.attachment_url
    const data = await downloadFromSupabase('media', filePath)
    if (!data) { total++; continue }
    const newUrl = await uploadToR2(filePath, data, contentTypeFromPath(filePath))
    if (newUrl) succeeded++
    total++
  }

  // Summary
  console.log(`\n── Done ──`)
  console.log(`Total: ${total}  |  Migrated: ${succeeded}  |  Failed: ${total - succeeded}`)
}

migrate().catch(console.error)
