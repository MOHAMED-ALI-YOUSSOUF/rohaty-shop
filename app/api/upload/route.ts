// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadImage } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification de l'utilisateur
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Parser le body de la requête
    const { file, folder } = await request.json()

    if (!file || !folder) {
      return NextResponse.json({ error: 'Fichier et dossier requis' }, { status: 400 })
    }

    // Validation simple du dossier pour s'assurer que c'est un dossier autorisé de Rohaty Shop
    const allowedFolders = [
      'rohaty-shop/stores/logo',
      'rohaty-shop/stores/banner',
      'rohaty-shop/products',
    ]

    if (!allowedFolders.includes(folder)) {
      return NextResponse.json({ error: 'Dossier de destination non autorisé' }, { status: 400 })
    }

    // 3. Uploader l'image vers Cloudinary via le helper
    const secureUrl = await uploadImage(file, folder)

    return NextResponse.json({ url: secureUrl })
  } catch (err: any) {
    console.error('Erreur API Upload Cloudinary:', err)
    return NextResponse.json(
      { error: err.message || "Erreur lors de l'upload de l'image" },
      { status: 500 }
    )
  }
}
