// lib/cloudinary.ts — server-side upload helper (never expose API secret client-side)
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/**
 * Upload a base64 data-URI or remote URL to Cloudinary.
 *
 * @param file    - base64 data URI (e.g. "data:image/png;base64,...")
 * @param folder  - Cloudinary folder path (e.g. "rohaty-shop/products")
 * @returns         Secure URL of the uploaded image
 */
export async function uploadImage(
  file: File,
  folder: string
): Promise<string> {
  const bytes = await file.arrayBuffer()

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )

    uploadStream.end(Buffer.from(bytes))
  })

  return (result as any).secure_url
}

export default cloudinary
