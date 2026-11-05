// app/api/categories/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { slugify } from '@/lib/utils'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

interface RawCategoryWithProducts {
  id: string
  name: string
  slug: string
  image_url: string | null
  position: number
  is_active: boolean
  created_at: string
  products?: { id: string }[]
}

// GET: Liste des catégories avec comptage des produits associés
export async function GET() {
  try {
    const supabase = getAdminClient()

    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*, products(id)')
      .order('position', { ascending: true })

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 400 })
    }

    const rawList = (categories as unknown as RawCategoryWithProducts[]) || []
    const result = rawList.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image_url: c.image_url,
      position: c.position,
      is_active: c.is_active,
      created_at: c.created_at,
      product_count: c.products ? c.products.length : 0,
    }))

    return NextResponse.json(result)
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

// POST: Ajouter une nouvelle catégorie officielle
export async function POST(req: Request) {
  try {
    const supabase = getAdminClient()
    const body = await req.json()
    const { name, image_url, position, is_active } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Le nom est obligatoire.' }, { status: 400 })
    }

    const slug = slugify(name.trim())

    // Vérifier unicité du slug
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Une catégorie avec ce nom ou slug existe déjà.' }, { status: 400 })
    }

    // Récupérer position max si non renseignée
    let pos = position
    if (typeof pos !== 'number') {
      const { data: lastCat } = await supabase
        .from('categories')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()
      pos = (lastCat?.position || 0) + 1
    }

    const { data: newCat, error: insertError } = await supabase
      .from('categories')
      .insert({
        name: name.trim(),
        slug,
        image_url: image_url || null,
        position: pos,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json(newCat)
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

// PATCH: Mettre à jour une catégorie (nom, image, position, statut)
export async function PATCH(req: Request) {
  try {
    const supabase = getAdminClient()
    const body = await req.json()
    const { id, name, image_url, position, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis.' }, { status: 400 })
    }

    const updates: Record<string, string | number | boolean | null> = {}

    if (name && typeof name === 'string' && name.trim()) {
      updates.name = name.trim()
      updates.slug = slugify(name.trim())
    }
    if (image_url !== undefined) {
      updates.image_url = image_url || null
    }
    if (typeof position === 'number') {
      updates.position = position
    }
    if (typeof is_active === 'boolean') {
      updates.is_active = is_active
    }

    const { data: updated, error: updateError } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Si le nom a changé, mettre à jour la colonne 'category' des produits associés
    if (updates.name && typeof updates.name === 'string') {
      await supabase
        .from('products')
        .update({ category: updates.name })
        .eq('category_id', id)
    }

    return NextResponse.json(updated)
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

// DELETE: Supprimer une catégorie UNIQUEMENT si aucun produit n'y est associé
export async function DELETE(req: Request) {
  try {
    const supabase = getAdminClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis.' }, { status: 400 })
    }

    // Vérifier les produits associés
    const { count, error: countErr } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 400 })
    }

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer cette catégorie car ${count} produit(s) y sont actuellement associés. Vous devez d'abord réaffecter ces produits.`,
        },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
