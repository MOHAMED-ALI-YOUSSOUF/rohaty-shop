import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'

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

export const metadata: Metadata = {
  title: {
    default: 'Rohaty Shop — Votre boutique en ligne sur WhatsApp',
    template: '%s | Rohaty Shop',
  },
  description:
    'Créez votre boutique en ligne en 5 minutes. Vos clients commandent directement via WhatsApp. Aucune commission, aucun paiement en ligne.',
  keywords: ['boutique en ligne', 'WhatsApp', 'e-commerce', 'Djibouti', 'vente en ligne'],
  authors: [{ name: 'Rohaty Digital' }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Rohaty Shop',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${inter.variable} data-scroll-behavior="smooth`}>
      <body className="bg-[#0F172A] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
