import { supabase } from './supabase'

export type StorageProvider = 'supabase' | 'r2'

type StorageConfig = {
  provider: StorageProvider
  r2: {
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
    bucket: import.meta.env.VITE_R2_BUCKET || 'eventgrid',
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
    return uploadToR2(file, path)
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

async function uploadToR2(
  path: string,
  file: File | Blob,
): Promise<{ url: string; storagePath: string }> {
  const r2Config = config.r2
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

  const publicUrl = `${r2Config.publicUrlBase}/${path}`

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
