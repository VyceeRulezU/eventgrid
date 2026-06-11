/**
 * Fix corrupted photo_urls caused by first migration run.
 * Reconstructs original Supabase URLs from character-split arrays,
 * migrates each file to R2, then updates the DB.
 */
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import path from 'path'
import fs from 'fs'

function loadEnv() {
  const envPath = path.resolve(import.meta.dirname, '..', '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    process.env[t.slice(0, eq).trim()] = v
  }
}
loadEnv()

const SUPABASE_URL   = process.env.VITE_SUPABASE_URL!
const SUPABASE_PUBLIC = `${SUPABASE_URL}/storage/v1/object/public`
const R2_ENDPOINT    = process.env.VITE_R2_ENDPOINT!
const R2_BUCKET      = process.env.VITE_R2_BUCKET!
const R2_PUBLIC_URL  = process.env.VITE_R2_PUBLIC_URL!

const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
})

/** Reconstruct original Supabase URL from a corrupted character-split array */
function reconstructUrl(corrupted: unknown): string | null {
  if (!corrupted) return null
  // If it's already a proper URL string, return as-is
  if (typeof corrupted === 'string' && corrupted.startsWith(SUPABASE_PUBLIC)) return corrupted
  // Parse the corrupted JSON array
  let arr: unknown[]
  if (Array.isArray(corrupted)) {
    arr = corrupted
  } else if (typeof corrupted === 'string') {
    try { arr = JSON.parse(corrupted) } catch { return null }
  } else return null
  if (!Array.isArray(arr)) return null
  // Filter out the wrapping brackets and join the characters
  const chars = arr.filter((c): c is string => typeof c === 'string' && c.length === 1)
  if (chars.length === 0) return null
  const joined = chars.join('')
  // Handle common wrapping: if first/last chars are [ and ]
  const trimmed = joined.replace(/^\[|\]$/g, '')
  // Remove quotes around the string
  const clean = trimmed.replace(/^"|"$/g, '')
  if (clean.startsWith('http')) return clean
  return null
}

function contentTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.jfif': 'image/jpeg',
  }
  return map[ext] || 'application/octet-stream'
}

async function migrate(url: string): Promise<string | null> {
  // Extract bucket and path from Supabase URL
  if (!url.startsWith(SUPABASE_PUBLIC)) return null
  const rest = url.slice(SUPABASE_PUBLIC.length + 1)
  const slash = rest.indexOf('/')
  if (slash === -1) return null
  const bucket = rest.slice(0, slash)
  const filePath = rest.slice(slash + 1)

  // Download from Supabase
  const res = await fetch(url)
  if (!res.ok) { console.error(`  Download failed: ${url}`); return null }
  const data = Buffer.from(await res.arrayBuffer())

  // Upload to R2
  try {
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: filePath,
      Body: data,
      ContentType: contentTypeFromPath(filePath),
    }))
    return `${R2_PUBLIC_URL}/${filePath}`
  } catch (err) {
    console.error(`  R2 upload error: ${filePath} — ${(err as Error).message}`)
    return null
  }
}

async function main() {
  // Fix task_comments
  console.log('── Fixing task_comments ──')
  const { data: tc } = await supabase.from('task_comments').select('id, photo_urls').not('photo_urls', 'is', null)
  for (const row of tc || []) {
    const url = reconstructUrl(row.photo_urls)
    if (!url) {
      // Empty or unresolvable — reset to empty array
      await supabase.from('task_comments').update({ photo_urls: '[]' }).eq('id', row.id)
      console.log(`  Reset empty for ${row.id}`)
      continue
    }
    console.log(`  Migrating ${row.id}: ${url.slice(0, 60)}...`)
    const newUrl = await migrate(url)
    if (newUrl) {
      await supabase.from('task_comments').update({ photo_urls: JSON.stringify([newUrl]) }).eq('id', row.id)
      console.log(`  → ${newUrl}`)
    } else {
      await supabase.from('task_comments').update({ photo_urls: '[]' }).eq('id', row.id)
      console.log(`  Failed, reset to []`)
    }
  }

  // Fix live_feed_posts
  console.log('\n── Fixing live_feed_posts ──')
  const { data: lp } = await supabase.from('live_feed_posts').select('id, photo_urls').not('photo_urls', 'is', null)
  for (const row of lp || []) {
    const url = reconstructUrl(row.photo_urls)
    if (!url) {
      await supabase.from('live_feed_posts').update({ photo_urls: '[]' }).eq('id', row.id)
      console.log(`  Reset empty for ${row.id}`)
      continue
    }
    console.log(`  Migrating ${row.id}: ${url.slice(0, 60)}...`)
    const newUrl = await migrate(url)
    if (newUrl) {
      await supabase.from('live_feed_posts').update({ photo_urls: JSON.stringify([newUrl]) }).eq('id', row.id)
      console.log(`  → ${newUrl}`)
    } else {
      await supabase.from('live_feed_posts').update({ photo_urls: '[]' }).eq('id', row.id)
      console.log(`  Failed, reset to []`)
    }
  }

  console.log('\nDone!')
}

main().catch(console.error)
