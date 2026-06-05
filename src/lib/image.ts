import imageCompression from 'browser-image-compression'

export type ImageUseCase = 'avatar' | 'fast' | 'standard' | 'hq'

const presets: Record<ImageUseCase, Parameters<typeof imageCompression>[1]> = {
  avatar: {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 400,
    useWebWorker: true,
  },
  fast: {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    initialQuality: 0.7,
  },
  standard: {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  },
  hq: {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.85,
  },
}

export function compressImage(file: File, useCase: ImageUseCase = 'standard') {
  return imageCompression(file, presets[useCase])
}

export async function uploadImage(
  file: File,
  useCase: ImageUseCase,
) {
  const compressed = await compressImage(file, useCase)
  return { compressed, size: compressed.size }
}
