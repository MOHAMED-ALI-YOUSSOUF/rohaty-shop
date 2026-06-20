import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { RESERVED_SLUGS } from '@/lib/reserved-slugs';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ available: false, error: "Slug requis" }, { status: 400 });
  }

  const supabase = await createClient();

  // Vérification slugs réservés
  if ((RESERVED_SLUGS as readonly string[]).includes(slug.toLowerCase())) {
    return NextResponse.json({
      available: false,
      error: "Ce slug est réservé"
    });
  }

  // Vérification en base de données
  const { data, error } = await supabase
    .from('stores')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ available: false, error: error.message });
  }

  const isAvailable = data === null;

  return NextResponse.json({
    available: isAvailable,
    error: isAvailable ? null : "Ce slug est déjà pris"
  });
}