// app/super-admin/analytics/page.tsx
import { Metadata } from 'next'
import { AnalyticsDashboardClient } from '@/components/super-admin/AnalyticsDashboardClient'

export const metadata: Metadata = {
  title: 'Statistiques & Trafic | Super Admin Rohaty Shop',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function SuperAdminAnalyticsPage() {
  return <AnalyticsDashboardClient />
}

