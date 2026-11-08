// app/super-admin/banners/page.tsx
import { getAdminSupabase } from '@/lib/auth/admin'
import {
  BannersAdminClient,
  BannerAdminItem,
} from '@/components/super-admin/BannersAdminClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminBannersPage() {
  const supabase = getAdminSupabase()

  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  const initialBanners: BannerAdminItem[] = (banners as BannerAdminItem[]) || []

  return <BannersAdminClient initialBanners={initialBanners} />
}

