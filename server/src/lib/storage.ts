import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuid } from 'uuid'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'aiinads'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL // e.g., https://pub-xxx.r2.dev

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn('R2 storage not configured - file uploads will fail')
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
})

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
}

export interface UploadResult {
  url: string
  key: string
  contentType: string
}

export async function uploadFile(
  buffer: Buffer,
  mimeType: string,
  category: 'image' | 'pdf'
): Promise<UploadResult> {
  // Validate mime type
  if (!ALLOWED_TYPES[category]?.includes(mimeType)) {
    throw new Error(`Invalid file type for ${category}: ${mimeType}`)
  }

  // Generate unique filename
  const ext = mimeType.split('/')[1] || 'bin'
  const key = `${category}s/${uuid()}.${ext}`

  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  )

  // Return public URL
  const url = R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${key}`
    : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`

  return { url, key, contentType: mimeType }
}
