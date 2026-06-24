// app/api/products/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer la liste d'IDs ordonnée
    const body = await req.json()
    const { ids } = body as { ids: string[] }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids invalides' }, { status: 400 })
    }

    // Récupérer la boutique de l'utilisateur pour vérification de propriété
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Boutique introuvable' }, { status: 404 })
    }

    // Mettre à jour sort_order pour chaque produit de la boutique
    const promises = ids.map((id, index) =>
      supabase
        .from('products')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('store_id', store.id)
    )

    const results = await Promise.all(promises)
    const failedResult = results.find((r) => r.error)

    if (failedResult && failedResult.error) {
      console.error('Reorder error:', failedResult.error)
      return NextResponse.json({ error: failedResult.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Reorder unexpected error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
