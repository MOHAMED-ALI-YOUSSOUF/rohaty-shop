// app/api/admin/banners/route.ts
import { NextResponse } from 'next/server'
import { getAdminSupabase, getAuthenticatedSuperAdmin } from '@/lib/auth/admin'

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}

// GET: Liste de toutes les bannières
export async function GET() {
  try {
    const supabase = getAdminSupabase()
    const { data: banners, error } = await supabase
      .from('banners')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(banners || [])
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

// POST: Ajouter une nouvelle bannière (Super Admin uniquement)
export async function POST(req: Request) {
  try {
    const adminUser = await getAuthenticatedSuperAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Accès réservé au Super Admin.' }, { status: 403 })
    }

    const supabase = getAdminSupabase()
    const body = await req.json()
    const { image_url, position, is_active } = body

    if (!image_url || typeof image_url !== 'string') {
      return NextResponse.json({ error: "L'image de la bannière est obligatoire." }, { status: 400 })
    }

    let pos = position
    if (typeof pos !== 'number') {
      const { data: lastBanner } = await supabase
        .from('banners')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()
      pos = (lastBanner?.position || 0) + 1
    }

    const { data: newBanner, error: insertError } = await supabase
      .from('banners')
      .insert({
        image_url: image_url.trim(),
        position: pos,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json(newBanner)
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

// PATCH: Mettre à jour une bannière (Super Admin uniquement)
export async function PATCH(req: Request) {
  try {
    const adminUser = await getAuthenticatedSuperAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Accès réservé au Super Admin.' }, { status: 403 })
    }

    const supabase = getAdminSupabase()
    const body = await req.json()
    const { id, image_url, position, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'ID requis.' }, { status: 400 })
    }

    const updates: Record<string, string | number | boolean | null> = {
      updated_at: new Date().toISOString(),
    }

    if (image_url && typeof image_url === 'string') {
      updates.image_url = image_url.trim()
    }
    if (typeof position === 'number') {
      updates.position = position
    }
    if (typeof is_active === 'boolean') {
      updates.is_active = is_active
    }

    const { data: updated, error: updateError } = await supabase
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

// DELETE: Supprimer une bannière (Super Admin uniquement)
export async function DELETE(req: Request) {
  try {
    const adminUser = await getAuthenticatedSuperAdmin()
    if (!adminUser) {
      return NextResponse.json({ error: 'Accès réservé au Super Admin.' }, { status: 403 })
    }

    const supabase = getAdminSupabase()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis.' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('banners')
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

