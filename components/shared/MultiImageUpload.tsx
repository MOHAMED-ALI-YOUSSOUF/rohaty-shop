// components/shared/MultiImageUpload.tsx
'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { UploadCloud, Loader2, Trash2, GripVertical, Star } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { compressImage, folderToProfile } from '@/lib/compressImage'


export interface UploadedImage {
    url: string
    isPrimary: boolean
}

interface MultiImageUploadProps {
    folder: 'rohaty-shop/stores/logo' | 'rohaty-shop/stores/banner' | 'rohaty-shop/products'
    images: UploadedImage[]
    onChange: (images: UploadedImage[]) => void
    maxImages?: number
    className?: string
}

export function MultiImageUpload({
    folder,
    images,
    onChange,
    maxImages = 8,
    className,
}: MultiImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const uploadFile = async (file: File): Promise<string | null> => {
        if (!file.type.startsWith('image/')) {
            setError('Fichier non valide.')
            return null
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Image trop volumineuse (max 5 Mo).')
            return null
        }

        // ✅ Compression avant upload — c'est tout ce qu'on ajoute
        const compressed = await compressImage(file, folderToProfile(folder))

        const formData = new FormData()
        formData.append('file', compressed)
        formData.append('folder', folder)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erreur d'upload")
        return data.url
    }

    const handleFiles = async (files: FileList) => {
        const remaining = maxImages - images.length
        if (remaining <= 0) {
            setError(`Maximum ${maxImages} images atteint.`)
            return
        }

        setUploading(true)
        setError(null)

        const toUpload = Array.from(files).slice(0, remaining)

        try {
            const urls = await Promise.all(toUpload.map(uploadFile))
            const valid = urls.filter(Boolean) as string[]

            const newImages: UploadedImage[] = valid.map((url, i) => ({
                url,
                // La toute première image uploadée devient primaire si aucune ne l'est encore
                isPrimary: images.length === 0 && i === 0,
            }))

            onChange([...images, ...newImages])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragOver(false)
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) handleFiles(e.target.files)
    }

    const removeImage = (index: number) => {
        const next = images.filter((_, i) => i !== index)
        // Si on supprime la primaire, la première restante devient primaire
        if (images[index].isPrimary && next.length > 0) {
            next[0] = { ...next[0], isPrimary: true }
        }
        onChange(next)
    }

    const setPrimary = (index: number) => {
        onChange(images.map((img, i) => ({ ...img, isPrimary: i === index })))
    }

    // Drag-to-reorder (simple swap)
    const dragItem = useRef<number | null>(null)
    const dragOverItem = useRef<number | null>(null)

    const handleReorderDragStart = (index: number) => {
        dragItem.current = index
    }
    const handleReorderDragEnter = (index: number) => {
        dragOverItem.current = index
    }
    const handleReorderDrop = () => {
        if (dragItem.current === null || dragOverItem.current === null) return
        const next = [...images]
        const dragged = next.splice(dragItem.current, 1)[0]
        next.splice(dragOverItem.current, 0, dragged)
        dragItem.current = null
        dragOverItem.current = null
        onChange(next)
    }

    const canAddMore = images.length < maxImages

    return (
        <div className={cn('space-y-3', className)}>
            {/* Grille d'images existantes */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {images.map((img, index) => (
                        <div
                            key={img.url}
                            draggable
                            onDragStart={() => handleReorderDragStart(index)}
                            onDragEnter={() => handleReorderDragEnter(index)}
                            onDragEnd={handleReorderDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group cursor-grab active:cursor-grabbing"
                        >
                            <Image src={img.url} alt="" fill className="object-cover" unoptimized />

                            {/* Badge primaire */}
                            {img.isPrimary && (
                                <div className="absolute top-1 left-1 bg-amber-500/90 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Star className="w-2.5 h-2.5 fill-current" />
                                    Principale
                                </div>
                            )}

                            {/* Overlay actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                {!img.isPrimary && (
                                    <button
                                        type="button"
                                        onClick={() => setPrimary(index)}
                                        className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                                        title="Définir comme image principale"
                                    >
                                        <Star className="w-3 h-3" /> Principale
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="p-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <GripVertical className="w-4 h-4 text-white/40 mt-1" />
                            </div>
                        </div>
                    ))}

                    {/* Slot d'ajout inline */}
                    {canAddMore && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-lg border border-dashed border-white/10 bg-bg-input/60 hover:bg-bg-input hover:border-white/20 flex flex-col items-center justify-center cursor-pointer text-text-muted transition-all gap-1"
                        >
                            {uploading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            ) : (
                                <>
                                    <span className="text-2xl font-light text-white/30">+</span>
                                    <span className="text-[9px]">Ajouter</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Zone de drop principale (visible si aucune image) */}
            {images.length === 0 && (
                <div
                    onDragEnter={() => setDragOver(true)}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        'relative w-full rounded-xl border border-dashed flex flex-col items-center justify-center p-8 cursor-pointer transition-all',
                        dragOver
                            ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(37,99,235,0.15)]'
                            : 'border-white/10 bg-bg-input/60 hover:bg-bg-input hover:border-white/20'
                    )}
                >
                    <div className="p-3 rounded-full bg-white/5 border border-white/5 text-text-secondary mb-3">
                        {uploading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        ) : (
                            <UploadCloud className="w-6 h-6" />
                        )}
                    </div>
                    <p className="text-sm font-bold text-white">Déposez vos images ici</p>
                    <p className="text-xs text-text-secondary mt-1">
                        ou <span className="text-primary font-semibold">parcourez vos fichiers</span>
                    </p>
                    <p className="text-[10px] text-text-muted mt-2">
                        JPG, PNG, WEBP · Max 5 Mo · {maxImages} images max
                    </p>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleChange}
                disabled={uploading || !canAddMore}
            />

            {error && <p className="text-xs text-red-400">{error}</p>}

            {images.length > 0 && (
                <p className="text-[10px] text-text-muted">
                    {images.length}/{maxImages} images · Glissez pour réordonner · ⭐ = image principale
                </p>
            )}
        </div>
    )
}