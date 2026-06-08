export async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file

  const img = await createImageBitmap(file)
  let { width, height } = img

  if (width <= maxWidth) {
    img.close()
    return file
  }

  height = Math.round((height / width) * maxWidth)
  width = maxWidth

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)
  img.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      },
      'image/jpeg',
      quality
    )
  })
}
