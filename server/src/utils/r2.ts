import type { R2Bucket, R2ObjectBody } from '@cloudflare/workers-types'

export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  file: ArrayBuffer,
  contentType?: string
): Promise<void> {
  await bucket.put(key, file, {
    httpMetadata: {
      contentType: contentType || 'application/octet-stream',
      cacheControl: 'public, max-age=31536000'
    }
  })
}

export async function getR2Object(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  return await bucket.get(key)
}

export async function deleteFromR2(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key)
}

export function generateR2Key(userId: string, fileName: string, timestamp?: number): string {
  const ts = timestamp || Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${ts}_${sanitizedFileName}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function getFileType(fileName: string, mimeType?: string): 'folder' | 'pdf' | 'image' | 'video' | 'zip' | 'code' {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType === 'application/pdf') return 'pdf'
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'zip'
  }
  
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image'
  if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext || '')) return 'video'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return 'zip'
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css'].includes(ext || '')) return 'code'
  
  return 'code'
}

