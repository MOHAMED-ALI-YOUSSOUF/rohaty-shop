// app/dashboard/apparence/ApparenceForm.tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { GradientButton } from '@/components/shared/GradientButton'
import { GlassCard } from '@/components/shared/GlassCard'
import { Loader2, Save, CheckCircle, XCircle, Paintbrush, Image as ImageIcon, Laptop } from 'lucide-react'
import Image from 'next/image'
import { STORE_THEMES, StoreTheme } from '@/lib/store-themes'
import { getContrastText } from '@/lib/color-utils'
import { cn } from '@/lib/utils'

interface StoreData {
  id: string
  name: string
  slug: string
  slogan: string | null
  logo_url: string | null
  banner_url: string | null
  primary_color: string
  page_color: string | null
  theme_name: string | null
  text_color: string | null
  secondary_text_color: string | null
  card_color: string | null
}

interface ApparenceFormProps {
  store: StoreData
}

interface ThemeColors {
  primary: string
  page: string
  text: string
  secondaryText: string
  card: string
}

const DEFAULT_COLORS: ThemeColors = {
  primary: '#2563EB',
  page: '#0F172A',
  text: '#FFFFFF',
  secondaryText: '#94A3B8',
  card: '#1E293B',
}

/** Compare les clés de thème sans se soucier de la casse / des espaces. */
function normalizeKey(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

/** Un champ "pastille couleur + code hex" réutilisable (remplace les 5 blocs dupliqués). */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-semibold uppercase text-text-secondary">
        {label}
      </label>
      <div className="flex items-center gap-2 bg-bg-input px-3 py-2.5 rounded-lg border border-white/10 w-full sm:w-auto">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const val = e.target.value
            if (val.startsWith('#') && val.length <= 7) onChange(val)
          }}
          maxLength={7}
          className="bg-transparent text-white font-mono text-xs w-20 outline-none"
        />
      </div>
    </div>
  )
}

export function ApparenceForm({ store }: ApparenceFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [logoUrl, setLogoUrl] = useState<string | null>(store.logo_url)
  const [bannerUrl, setBannerUrl] = useState<string | null>(store.banner_url)
  const [themeName, setThemeName] = useState<string>(store.theme_name || 'midnight')

  const [colors, setColors] = useState<ThemeColors>({
    primary: store.primary_color || DEFAULT_COLORS.primary,
    page: store.page_color || DEFAULT_COLORS.page,
    text: store.text_color || DEFAULT_COLORS.text,
    secondaryText: store.secondary_text_color || DEFAULT_COLORS.secondaryText,
    card: store.card_color || DEFAULT_COLORS.card,
  })

  // Clé de thème "actif" recalculée à chaque render à partir de l'état courant.
  // Aucun useEffect qui resynchronise depuis `store` -> plus de reset intempestif
  // de la sélection quand le parent (Server Component) re-render.
  const activeThemeKey = useMemo(() => normalizeKey(themeName), [themeName])

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  const handleSelectTheme = (key: string, theme: StoreTheme) => {
    setThemeName(key)
    setColors({
      primary: theme.primaryColor,
      page: theme.pageColor,
      text: theme.textColor,
      secondaryText: theme.secondaryTextColor,
      card: theme.cardColor,
    })
  }

  const handlePageColorChange = (value: string) => {
    const newTextColor = getContrastText(value)
    const isLight = newTextColor === '#111827'
    setColors((prev) => ({
      ...prev,
      page: value,
      text: newTextColor,
      secondaryText: isLight ? '#6B7280' : '#94A3B8',
      card: isLight ? '#F9FAFB' : '#1E293B',
    }))
  }

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
          primary_color: colors.primary,
          page_color: colors.page,
          theme_name: themeName,
          text_color: colors.text,
          secondary_text_color: colors.secondaryText,
          card_color: colors.card,
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

            {/* Section Thèmes */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-text-secondary mb-2">
                  Choisir un thème
                </label>
                <p className="text-xs text-text-secondary mb-4">
                  Sélectionnez un style de départ pré-configuré pour votre boutique.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(STORE_THEMES).map(([key, theme]) => {
                  const isActive = normalizeKey(key) === activeThemeKey
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectTheme(key, theme)}
                      className={cn(
                        "flex flex-col gap-3 p-4 rounded-xl border transition-all text-left w-full cursor-pointer",
                        isActive
                          ? "bg-white/10 border-primary shadow-lg shadow-primary/10"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm font-bold text-white">{theme.name}</span>
                        {isActive && (
                          <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-[10px]">
                            Actif
                          </span>
                        )}
                      </div>

                      {/* Couleur prévisualisation */}
                      <div className="flex gap-2 p-2 rounded-lg items-center w-full" style={{ backgroundColor: theme.pageColor }}>
                        <span className="w-5 h-5 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: theme.primaryColor }} title="Principale" />
                        <span className="w-5 h-5 rounded-md border border-white/10 shrink-0" style={{ backgroundColor: theme.cardColor }} title="Cartes" />
                        <span className="text-[10px] font-medium leading-none shrink-0" style={{ color: theme.textColor }}>Abc</span>
                        <span className="text-[10px] font-medium leading-none shrink-0" style={{ color: theme.secondaryTextColor }}>Abc</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Personnalisation avancée */}
            <div className="space-y-6 pt-6 border-t border-white/5">
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-white">Personnalisation avancée</h3>
                <p className="text-[11px] text-text-secondary mt-1">
                  Ajustez les couleurs individuellement pour affiner l'identité visuelle de votre vitrine.
                </p>
              </div>

              <ColorField
                label="Couleur principale (Thème)"
                value={colors.primary}
                onChange={(v) => updateColor('primary', v)}
              />
              <ColorField
                label="Couleur de fond"
                value={colors.page}
                onChange={handlePageColorChange}
              />
              <ColorField
                label="Texte principal"
                value={colors.text}
                onChange={(v) => updateColor('text', v)}
              />
              <ColorField
                label="Texte secondaire"
                value={colors.secondaryText}
                onChange={(v) => updateColor('secondaryText', v)}
              />
              <ColorField
                label="Fond cartes produits"
                value={colors.card}
                onChange={(v) => updateColor('card', v)}
              />
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
            <div className="h-[480px] overflow-y-auto custom-scrollbar select-none relative" style={{ backgroundColor: colors.page, color: colors.text }}>
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
                    <span className="text-[10px] font-heading tracking-widest" style={{ color: colors.secondaryText }}>
                      Bannière non configurée
                    </span>
                  </div>
                )}
              </div>

              {/* Logo and Info */}
              <div className="px-4 -mt-1 relative z-10 flex items-end gap-3">
                <div className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden relative shadow-lg flex items-center justify-center shrink-0" style={{ backgroundColor: colors.card }}>
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Mock Logo"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xl font-bold font-heading" style={{ color: colors.primary }}>
                      {store.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="mb-1  truncate">
                  <h4 className="text-sm font-bold leading-tight truncate" style={{ color: colors.text }}>
                    {store.name}
                  </h4>
                  <p className="text-[10px] truncate" style={{ color: colors.secondaryText }}>
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
                    style={{ backgroundColor: colors.primary }}
                  >
                    Tous
                  </span>
                  <span className="px-2.5 py-1 rounded-full border shrink-0" style={{ backgroundColor: colors.card, color: colors.secondaryText, borderColor: 'rgba(255,255,255,0.05)' }}>
                    Accessoires
                  </span>
                  <span className="px-2.5 py-1 rounded-full border shrink-0" style={{ backgroundColor: colors.card, color: colors.secondaryText, borderColor: 'rgba(255,255,255,0.05)' }}>
                    Mode Homme
                  </span>
                </div>

                {/* Mock Products Grid */}
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {/* Mock Card 1 */}
                  <div
                    className="rounded-xl border overflow-hidden transition-all duration-200"
                    style={{
                      backgroundColor: colors.card,
                      boxShadow: `0 4px 12px ${colors.primary}10`,
                      borderColor: `${colors.primary}20`,
                    }}
                  >
                    <div className="aspect-square relative flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <span className="text-[9px]" style={{ color: colors.secondaryText }}>Image Produit</span>
                    </div>
                    <div className="p-2 space-y-1.5">
                      <p className="text-[11px] font-semibold truncate leading-tight" style={{ color: colors.text }}>
                        Exemple Produit A
                      </p>
                      <div className="flex justify-between items-baseline gap-1">
                        <span className="text-xs font-bold font-heading" style={{ color: colors.primary }}>
                          8 500 DJF
                        </span>
                        <span className="text-[9px] line-through" style={{ color: colors.secondaryText }}>
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
                  <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: colors.card, borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="aspect-square relative flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <span className="text-[9px]" style={{ color: colors.secondaryText }}>Image Produit</span>
                    </div>
                    <div className="p-2 space-y-1.5">
                      <p className="text-[11px] font-semibold truncate leading-tight" style={{ color: colors.text }}>
                        Exemple Produit B
                      </p>
                      <div>
                        <span className="text-xs font-bold font-heading" style={{ color: colors.primary }}>
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