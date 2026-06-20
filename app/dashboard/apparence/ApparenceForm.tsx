// app/dashboard/apparence/ApparenceForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { GradientButton } from '@/components/shared/GradientButton'
import { GlassCard } from '@/components/shared/GlassCard'
import { Loader2, Save, CheckCircle, XCircle, Paintbrush, Image as ImageIcon, Laptop } from 'lucide-react'
import Image from 'next/image'

interface StoreData {
  id: string
  name: string
  slug: string
  slogan: string | null
  logo_url: string | null
  banner_url: string | null
  primary_color: string
}

interface ApparenceFormProps {
  store: StoreData
}

const PRESET_COLORS = [
  { name: 'Bleu Rohaty', hex: '#2563EB' },
  { name: 'Cyan Accent', hex: '#06B6D4' },
  { name: 'Violet Élite', hex: '#8B5CF6' },
  { name: 'Vert Émeraude', hex: '#10B981' },
  { name: 'Rose Rubis', hex: '#F43F5E' },
  { name: 'Orange Amber', hex: '#F59E0B' },
]

export function ApparenceForm({ store }: ApparenceFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // States pour l'aperçu en temps réel
  const [logoUrl, setLogoUrl] = useState<string | null>(store.logo_url)
  const [bannerUrl, setBannerUrl] = useState<string | null>(store.banner_url)
  const [primaryColor, setPrimaryColor] = useState<string>(store.primary_color || '#2563EB')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('stores')
        .update({
          logo_url: logoUrl || null,
          banner_url: bannerUrl || null,
          primary_color: primaryColor,
        })
        .eq('id', store.id)

      if (updateError) throw updateError

      setSuccess(true)
      router.refresh()

      setTimeout(() => setSuccess(false), 4000)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Une erreur est survenue lors de l'enregistrement de l'apparence.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {success && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-sm text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>L'apparence de votre boutique a été mise à jour avec succès.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-sm text-red-400 flex items-center gap-2">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Paramètres (Gauche) */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Identité Visuelle</h2>
            </div>

            {/* Logo de la boutique */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary">
                Logo de la boutique
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ImageUpload
                  folder="rohaty-shop/stores/logo"
                  currentUrl={logoUrl}
                  onUpload={(url) => setLogoUrl(url)}
                  onClear={() => setLogoUrl(null)}
                  aspectRatio="square"
                  className="shrink-0"
                />
                <div className="text-xs text-text-muted space-y-1.5 text-center sm:text-left">
                  <p className="text-white font-semibold">Recommandations :</p>
                  <p>• Image carrée (ex: 200x200 pixels).</p>
                  <p>• Format PNG avec fond transparent de préférence.</p>
                  <p>• S'affichera dans le header de votre boutique.</p>
                </div>
              </div>
            </div>

            {/* Bannière de la boutique */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary">
                Bannière de couverture
              </label>
              <ImageUpload
                folder="rohaty-shop/stores/banner"
                currentUrl={bannerUrl}
                onUpload={(url) => setBannerUrl(url)}
                onClear={() => setBannerUrl(null)}
                aspectRatio="banner"
              />
              <p className="text-[10px] text-text-muted">
                Format paysage (ratio 3:1 recommandé, ex: 1200x400 pixels). S'affiche en haut de votre vitrine.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <Paintbrush className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Charte Graphique</h2>
            </div>

            {/* Couleur principale */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary mb-2">
                  Couleur principale (Thème)
                </label>
                <p className="text-xs text-text-secondary mb-4">
                  Cette couleur sera appliquée sur les boutons, les bordures de survol, et les éléments clés de votre vitrine.
                </p>
              </div>

              {/* Pré-sélections de couleur */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setPrimaryColor(color.hex)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-white/20"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-[10px] text-text-secondary truncate w-full text-center">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Sélecteur personnalisé */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2 bg-bg-input px-3 py-2.5 rounded-lg border border-white/10 w-full sm:w-auto">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor.toUpperCase()}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val.startsWith('#') && val.length <= 7) {
                        setPrimaryColor(val)
                      }
                    }}
                    maxLength={7}
                    className="bg-transparent text-white font-mono text-xs w-20 outline-none"
                  />
                </div>
                <span className="text-xs text-text-muted font-mono">
                  Couleur active
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Aperçu en direct (Droite) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary">
              Aperçu en temps réel
            </label>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              <Laptop className="w-3.5 h-3.5" />
              Vitrine publique
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-bg-base overflow-hidden shadow-2xl relative">
            {/* Storefront Mockup Topbar */}
            <div className="bg-bg-surface border-b border-white/5 px-4 py-2.5 flex items-center gap-2 text-xs">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="bg-bg-input rounded px-3 py-1 text-[10px] text-text-secondary truncate w-full max-w-[240px] mx-auto font-mono text-center select-none">
                shop.rohaty.com/{store.slug}
              </div>
            </div>

            {/* Storefront Preview Body */}
            <div className="bg-bg-base h-[480px] overflow-y-auto custom-scrollbar select-none text-white relative">
              {/* Banner Area */}
              <div className="relative h-28 bg-gradient-to-r from-bg-muted to-bg-surface border-b border-white/5">
                {bannerUrl ? (
                  <Image
                    src={bannerUrl}
                    alt="Mock Banner"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center opacity-70">
                    <span className="text-[10px] text-text-muted font-heading tracking-widest">
                      Bannière non configurée
                    </span>
                  </div>
                )}
              </div>

              {/* Logo and Info */}
              <div className="px-4 -mt-8 relative z-10 flex items-end gap-3">
                <div className="w-16 h-16 rounded-xl border border-white/10 bg-bg-surface overflow-hidden relative shadow-lg flex items-center justify-center shrink-0">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Mock Logo"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xl font-bold font-heading text-primary">
                      {store.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="mb-1 truncate">
                  <h4 className="text-sm font-bold text-white leading-tight truncate">
                    {store.name}
                  </h4>
                  <p className="text-[10px] text-text-secondary truncate">
                    {store.slogan || 'Slogan de votre boutique'}
                  </p>
                </div>
              </div>

              {/* Action Button & Categories */}
              <div className="px-4 mt-4 space-y-4">
                <button
                  type="button"
                  className="w-full py-2 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 whatsapp-pulse"
                  style={{ backgroundColor: '#10B981' }}
                >
                  💬 Contacter sur WhatsApp
                </button>

                {/* Categories tab */}
                <div className="flex gap-2 border-b border-white/5 pb-2 overflow-x-auto text-[10px] no-scrollbar">
                  <span
                    className="px-2.5 py-1 rounded-full text-white font-medium shrink-0 cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Tous
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-text-secondary bg-white/5 border border-white/5 shrink-0">
                    Accessoires
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-text-secondary bg-white/5 border border-white/5 shrink-0">
                    Mode Homme
                  </span>
                </div>

                {/* Mock Products Grid */}
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {/* Mock Card 1 */}
                  <div
                    className="rounded-xl bg-bg-surface border border-white/5 overflow-hidden transition-all duration-200"
                    style={{
                      boxShadow: `0 4px 12px ${primaryColor}10`,
                      borderColor: `${primaryColor}20`,
                    }}
                  >
                    <div className="aspect-square bg-white/5 relative flex items-center justify-center">
                      <span className="text-[9px] text-text-muted">Image Produit</span>
                    </div>
                    <div className="p-2 space-y-1.5">
                      <p className="text-[11px] font-semibold text-white truncate leading-tight">
                        Exemple Produit A
                      </p>
                      <div className="flex justify-between items-baseline gap-1">
                        <span
                          className="text-xs font-bold font-heading"
                          style={{ color: primaryColor }}
                        >
                          8 500 DJF
                        </span>
                        <span className="text-[9px] text-text-muted line-through">
                          10 000 DJF
                        </span>
                      </div>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded text-[10px] font-bold text-white text-center cursor-pointer"
                        style={{ backgroundColor: '#10B981' }}
                      >
                        💬 Commander
                      </button>
                    </div>
                  </div>

                  {/* Mock Card 2 */}
                  <div className="rounded-xl bg-bg-surface border border-white/5 overflow-hidden">
                    <div className="aspect-square bg-white/5 relative flex items-center justify-center">
                      <span className="text-[9px] text-text-muted">Image Produit</span>
                    </div>
                    <div className="p-2 space-y-1.5">
                      <p className="text-[11px] font-semibold text-white truncate leading-tight">
                        Exemple Produit B
                      </p>
                      <div>
                        <span
                          className="text-xs font-bold font-heading"
                          style={{ color: primaryColor }}
                        >
                          15 000 DJF
                        </span>
                      </div>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded text-[10px] font-bold text-white text-center cursor-pointer"
                        style={{ backgroundColor: '#10B981' }}
                      >
                        💬 Commander
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action final bar */}
      <div className="flex justify-end pt-4 border-t border-white/5">
        <GradientButton
          type="submit"
          variant="primary"
          className="w-full sm:w-auto px-8 py-3.5"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mise à jour...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer l'apparence
            </>
          )}
        </GradientButton>
      </div>
    </form>
  )
}
