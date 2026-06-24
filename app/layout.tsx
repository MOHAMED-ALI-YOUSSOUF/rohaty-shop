import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'
import { GoogleAnalytics } from '@/components/shared/GoogleAnalytics'
import { ServiceWorkerRegistration } from '@/components/shared/ServiceWorkerRegistration'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    default: 'Rohaty Shop — Votre boutique en ligne sur WhatsApp',
    template: '%s | Rohaty Shop',
  },
  description:
    'Créez votre boutique en ligne en 5 minutes. Vos clients commandent directement via WhatsApp. Aucune commission, aucun paiement en ligne.',
  keywords: ['boutique en ligne', 'WhatsApp', 'e-commerce', 'Djibouti', 'vente en ligne'],
  authors: [{ name: 'Rohaty Digital' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Rohaty Shop',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Rohaty Shop',
  },
  icons: {
    apple: '/icons/icon-192.png',
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Rohaty Shop" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="mask-icon" href="/logo.png" color="#2563EB" />
      </head>
      <body className="bg-[#0F172A] text-white antialiased">
        <GoogleAnalytics />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}
