import { supabase } from './supabase'

export type StorageProvider = 'supabase' | 'r2'

/** Upload a file to any bucket. Returns the public URL. */
export async function uploadFile(
  bucket: string,
  file: File | Blob,
  path: string,
): Promise<{ url: string; storagePath: string }> {
  const provider = (import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider) || 'supabase'
  if (provider === 'r2') {
    return uploadToR2ViaEdge(file, path)
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

/** Upload to R2 via the upload-header-image edge function (no client-side secrets). */
async function uploadToR2ViaEdge(
  file: File | Blob,
  path: string,
): Promise<{ url: string; storagePath: string }> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const { error } = await supabase.functions.invoke('upload-header-image', {
    body: { file: base64, name: path.split('/').pop() || 'file', event_id: path.split('/')[0] },
  })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const publicUrlBase = import.meta.env.VITE_R2_PUBLIC_URL || ''
  return { url: `${publicUrlBase}/${path}`, storagePath: path }
}

/** Build the full R2/Supabase URL from a stored path */
export function getFileUrl(bucket: string, path: string): string {
  const provider = (import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider) || 'supabase'
  if (provider === 'r2') {
    const publicUrlBase = import.meta.env.VITE_R2_PUBLIC_URL || ''
    return `${publicUrlBase}/${path}`
  }
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
  return publicUrl
}

export function getStorageProvider(): StorageProvider {
  return (import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider) || 'supabase'
}

/** Return an optimized image URL with optional resize. */
export function getOptimizedMediaUrl(
  bucket: string,
  path: string,
  options?: { width?: number; height?: number; resize?: 'cover' | 'contain' | 'fill' }
): string {
  const base = getFileUrl(bucket, path)
  const provider = (import.meta.env.VITE_STORAGE_PROVIDER as StorageProvider) || 'supabase'

  if (provider === 'r2') return base

  const params = new URLSearchParams()
  if (options?.width) params.set('width', String(options.width))
  if (options?.height) params.set('height', String(options.height))
  if (options?.resize) params.set('resize', options.resize)
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}
