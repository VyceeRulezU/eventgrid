import { supabase } from './supabase'

export type StorageProvider = 'supabase' | 'r2'

type StorageConfig = {
  provider: StorageProvider
  r2: {
    endpoint: string
    bucket: string
    region: string
    accessKeyId: string
    secretAccessKey: string
    publicUrlBase: string
  }
}

const config: StorageConfig = {
  provider: (import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider) || 'supabase',
  r2: {
    endpoint: import.meta.env.VITE_R2_ENDPOINT || '',
    bucket: import.meta.env.VITE_R2_BUCKET || 'eventgrid',
    region: import.meta.env.VITE_R2_REGION || 'auto',
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '',
    publicUrlBase: import.meta.env.VITE_R2_PUBLIC_URL || '',
  },
}

/** Upload a file to any bucket. Returns the public URL. */
export async function uploadFile(
  bucket: string,
  file: File | Blob,
  path: string,
): Promise<{ url: string; storagePath: string }> {
  if (config.provider === 'r2' && config.r2.endpoint) {
    return uploadToR2(path, file)
  }

  return uploadToSupabase(bucket, file, path)
}

async function uploadToSupabase(
  bucket: string,
  file: File | Blob,
  path: string,
): Promise<{ url: string; storagePath: string }> {
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return { url: publicUrl, storagePath: path }
}

function hexEncode(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256(data: ArrayBuffer | string): Promise<ArrayBuffer> {
  const input = typeof data === 'string' ? new TextEncoder().encode(data) : data
  return crypto.subtle.digest('SHA-256', input)
}

async function hmacSha256(key: ArrayBuffer, data: ArrayBuffer | string): Promise<ArrayBuffer> {
  const input = typeof data === 'string' ? new TextEncoder().encode(data) : data
  return crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), input)
}

function toISO8601(date: Date): string {
  return date.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '')
}

function formatDate(date: Date): string {
  return toISO8601(date).substring(0, 8)
}

async function uploadToR2(
  path: string,
  file: File | Blob,
): Promise<{ url: string; storagePath: string }> {
  const r2Config = config.r2
  const endpoint = r2Config.endpoint.replace(/\/+$/, '')
  const encodedPath = path.split('/').map(seg => encodeURIComponent(seg)).join('/')
  const url = `${endpoint}/${r2Config.bucket}/${encodedPath}`

  const now = new Date()
  const dateStamp = formatDate(now)
  const amzDate = toISO8601(now)
  const service = 's3'
  const region = r2Config.region
  const algorithm = 'AWS4-HMAC-SHA256'

  const body = file instanceof File ? file : new Blob([file])
  const bodyBuffer = await body.arrayBuffer()
  const bodyHash = hexEncode(await sha256(bodyBuffer))
  const contentType = file instanceof File ? file.type : 'image/jpeg'

  const canonicalUri = `/${r2Config.bucket}/${encodedPath}`
  const canonicalQuery = ''
  const host = new URL(endpoint).host
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${bodyHash}\nx-amz-date:${amzDate}\n`

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join('\n')

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    hexEncode(await sha256(canonicalRequest)),
  ].join('\n')

  const kSecret = new TextEncoder().encode('AWS4' + r2Config.secretAccessKey).buffer
  const kDate = await hmacSha256(kSecret, dateStamp)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  const kSigning = await hmacSha256(kService, 'aws4_request')
  const signature = hexEncode(await hmacSha256(kSigning, stringToSign))

  const authorization = `${algorithm} Credential=${r2Config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const response = await fetch(url, {
    method: 'PUT',
    body: bodyBuffer,
    headers: {
      'Content-Type': contentType,
      'x-amz-content-sha256': bodyHash,
      'x-amz-date': amzDate,
      'Authorization': authorization,
    },
  })

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText)
    throw new Error(`R2 upload failed: ${response.status} ${text}`)
  }

  const publicUrl = `${r2Config.publicUrlBase}/${encodedPath}`

  return { url: publicUrl, storagePath: path }
}

/** Build the full R2/Supabase URL from a stored path */
export function getFileUrl(bucket: string, path: string): string {
  if (config.provider === 'r2') {
    return `${config.r2.publicUrlBase}/${path}`
  }
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
  return publicUrl
}

export function getStorageProvider(): StorageProvider {
  return config.provider
}

/** Return an optimized image URL with optional resize.
 *  For Supabase storage, adds transform params. For R2, returns CDN URL as-is. */
export function getOptimizedMediaUrl(
  bucket: string,
  path: string,
  options?: { width?: number; height?: number; resize?: 'cover' | 'contain' | 'fill' }
): string {
  const base = getFileUrl(bucket, path)

  if (config.provider === 'r2') return base

  const params = new URLSearchParams()
  if (options?.width) params.set('width', String(options.width))
  if (options?.height) params.set('height', String(options.height))
  if (options?.resize) params.set('resize', options.resize)
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}
