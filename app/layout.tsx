import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@/components/shared/GoogleAnalytics";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Rohaty Shop — Achetez en ligne à Djibouti",
    template: "%s | Rohaty Shop",
  },
  description:
    "Tous les produits des boutiques djiboutiennes au même endroit. Commandez directement via WhatsApp, sans compte et sans paiement en ligne.",
  keywords: [
    "boutique en ligne",
    "WhatsApp",
    "e-commerce",
    "Djibouti",
    "achat en ligne",
    "marketplace",
  ],
  authors: [{ name: "Rohaty Digital" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // barre de statut lisible sur fond blanc
    title: "Rohaty Shop",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Rohaty Shop",
  },
  icons: {
    apple: "/icons/icon-192.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${inter.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        <meta
          name="google-site-verification"
          content="SQFrhYCg-0ikx_ZpxYJHEGVYTeJSmevgzo9rksUB2DI"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Rohaty Shop" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="mask-icon" href="/logo.png" color="#2563EB" />
      </head>
      <body className="bg-white text-slate-900 antialiased">
        <GoogleAnalytics />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
