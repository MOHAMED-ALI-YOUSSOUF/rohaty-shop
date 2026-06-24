// lib/compressImage.ts
import imageCompression from 'browser-image-compression'

type CompressionProfile = 'product' | 'logo' | 'banner'

const profiles: Record<CompressionProfile, Parameters<typeof imageCompression>[1]> = {
  product: {
    maxSizeMB: 0.8,          // produit : 800 Ko max
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.82,
  },
  logo: {
    maxSizeMB: 0.2,          // logo : 200 Ko max (souvent petit)
    maxWidthOrHeight: 400,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85,
  },
  banner: {
    maxSizeMB: 0.5,          // bannière : 500 Ko max
    maxWidthOrHeight: 1400,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.80,
  },
}

export async function compressImage(
  file: File,
  profile: CompressionProfile = 'product'
): Promise<File> {
  // Ne compresse pas si déjà petit (< 100 Ko)
  if (file.size < 100 * 1024) return file

  return imageCompression(file, profiles[profile])
}

// Déduit le profil depuis le folder Cloudinary
export function folderToProfile(folder: string): CompressionProfile {
  if (folder.includes('logo')) return 'logo'
  if (folder.includes('banner')) return 'banner'
  return 'product'
}