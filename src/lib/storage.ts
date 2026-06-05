import { supabase } from './supabase'

export type StorageProvider = 'supabase' | 'r2'

type StorageConfig = {
  provider: StorageProvider
  r2?: {
    endpoint: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
    publicUrlBase: string
  }
}

const config: StorageConfig = {
  provider: (import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider) || 'supabase',
  r2: {
    endpoint: import.meta.env.VITE_R2_ENDPOINT || '',
    bucket: import.meta.env.VITE_R2_BUCKET || 'eventgrid-media',
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '',
    publicUrlBase: import.meta.env.VITE_R2_PUBLIC_URL || '',
  },
}

function buildStoragePath(orgId: string, eventId: string, filename: string) {
  return `${orgId}/${eventId}/${Date.now()}_${filename}`
}

export async function uploadMedia(
  file: File | Blob,
  orgId: string,
  eventId: string,
  tag: string,
  ext = 'jpg',
) {
  const path = buildStoragePath(orgId, eventId, `${tag}.${ext}`)

  if (config.provider === 'r2' && config.r2?.endpoint) {
    return uploadToR2(file, path, tag)
  }

  return uploadToSupabase(file, path, tag)
}

async function uploadToSupabase(file: File | Blob, path: string, tag: string) {
  const { data: storageData, error: storageError } = await supabase.storage
    .from('event-media')
    .upload(path, file)

  if (storageError || !storageData) {
    throw storageError || new Error('Upload failed')
  }

  const { data: { publicUrl } } = supabase.storage
    .from('event-media')
    .getPublicUrl(path)

  return { url: publicUrl, storagePath: path, tag }
}

async function uploadToR2(file: File | Blob, path: string, tag: string) {
  const r2Config = config.r2!
  const url = `${r2Config.endpoint}/${r2Config.bucket}/${path}`

  const response = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file instanceof File ? file.type : 'image/jpeg',
      'x-amz-acl': 'public-read',
    },
  })

  if (!response.ok) {
    throw new Error(`R2 upload failed: ${response.statusText}`)
  }

  const publicUrl = `${r2Config.publicUrlBase || r2Config.endpoint}/${r2Config.bucket}/${path}`

  return { url: publicUrl, storagePath: path, tag }
}

export function getStorageProvider(): StorageProvider {
  return config.provider
}
