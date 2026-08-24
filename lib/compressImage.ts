// lib/compressImage.ts
import imageCompression from 'browser-image-compression'

type CompressionProfile = 'product' | 'logo' | 'banner'

const profiles: Record<CompressionProfile, Parameters<typeof imageCompression>[1]> = {
  product: {
    maxSizeMB: 2,            // WebP compense bien — pas de limite agressive
    maxWidthOrHeight: 2000,  // Préserve les images ≤ 2000 px (ex: 903×1645 reste intacte)
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.90,
  },
  logo: {
    maxSizeMB: 0.5,          // logos : petit mais net
    maxWidthOrHeight: 600,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.92,
  },
  banner: {
    maxSizeMB: 2,            // bannières larges — qualité prioritaire
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.90,
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