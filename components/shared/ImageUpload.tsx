// components/shared/ImageUpload.tsx
'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { UploadCloud, Loader2, Image as ImageIcon, Trash2, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  folder: 'rohaty-shop/stores/logo' | 'rohaty-shop/stores/banner' | 'rohaty-shop/products'
  currentUrl?: string | null
  onUpload: (url: string) => void
  onClear?: () => void
  className?: string
  aspectRatio?: 'square' | 'banner'
}

export function ImageUpload({
  folder,
  currentUrl,
  onUpload,
  onClear,
  className,
  aspectRatio = 'square',
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Met à jour la preview si l'URL courante change (par ex. lors de l'édition d'un produit existant)
  if (currentUrl && currentUrl !== preview) {
    setPreview(currentUrl)
  }

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const uploadFile = async (file: File) => {
    // S'assurer que c'est bien une image
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide.')
      return
    }

    // Limite de taille : 5 Mo
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image est trop volumineuse (max 5 Mo).')
      return
    }

    setLoading(true)
    setError(null)

    // Créer une preview locale immédiate
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    try {
      // Lire le fichier comme base64
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = async () => {
        const base64data = reader.result as string

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: base64data,
            folder,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors de l'upload")
        }

        onUpload(data.url)
        setPreview(data.url)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Impossible d'uploader l'image")
      // Annuler la preview locale en cas d'erreur
      setPreview(currentUrl || null)
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0])
    }
  }

  const triggerInput = () => {
    fileInputRef.current?.click()
  }

  const clearImage = (e: any) => {
    e.stopPropagation()
    setPreview(null)
    if (onClear) onClear()
    else onUpload('')
  }

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
        disabled={loading}
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInput}
        className={cn(
          'relative w-full rounded-xl border border-dashed flex flex-col items-center justify-center p-4 cursor-pointer select-none overflow-hidden transition-all',
          aspectRatio === 'square' ? 'aspect-square max-w-[260px] mx-auto' : 'aspect-[3/1] max-w-full',
          dragActive
            ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(37,99,235,0.15)]'
            : 'border-white/10 bg-bg-input/60 hover:bg-bg-input hover:border-white/20',
          loading && 'pointer-events-none opacity-85',
          error && 'border-danger/30 bg-danger/5'
        )}
      >
        {preview ? (
          <div className="absolute inset-0 w-full h-full group">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized
            />
            {/* Hover actions overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  triggerInput()
                }}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
                title="Remplacer l'image"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={clearImage}
                className="p-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors"
                title="Supprimer l'image"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-xs font-semibold text-white">Upload en cours...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="p-3 rounded-full bg-white/5 border border-white/5 text-text-secondary">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                {loading ? 'Chargement...' : 'Déposez votre image'}
              </p>
              <p className="text-xs text-text-secondary">
                ou <span className="text-primary font-semibold">parcourez vos fichiers</span>
              </p>
            </div>
            <p className="text-[10px] text-text-muted">
              JPG, PNG, WEBP · Max 5 Mo
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
      )}
    </div>
  )
}
