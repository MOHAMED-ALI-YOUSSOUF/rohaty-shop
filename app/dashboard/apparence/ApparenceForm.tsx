// app/dashboard/apparence/ApparenceForm.tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ImageUpload } from '@/components/shared/ImageUpload'
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

function normalizeKey(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

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
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-300 w-full sm:w-auto shadow-2xs">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-lg border border-slate-200 bg-transparent cursor-pointer"
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const val = e.target.value
            if (val.startsWith('#') && val.length <= 7) onChange(val)
          }}
          maxLength={7}
          className="bg-transparent text-slate-900 font-mono text-xs w-20 outline-hidden font-bold"
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
    <form onSubmit={onSubmit} className="space-y-6 font-sans">
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>L&apos;apparence de votre boutique a été mise à jour avec succès.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <XCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Paramètres (Gauche) */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="p-6 space-y-6 bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <ImageIcon className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-base font-bold text-slate-900">Identité Visuelle</h2>
            </div>

            {/* Logo de la boutique */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
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
                <div className="text-xs text-slate-500 space-y-1.5 text-center sm:text-left">
                  <p className="text-slate-900 font-bold">Recommandations :</p>
                  <p>• Image carrée (ex: 200x200 pixels).</p>
                  <p>• Format PNG avec fond transparent de préférence.</p>
                  <p>• S&apos;affichera dans le header de votre boutique.</p>
                </div>
              </div>
            </div>

            {/* Bannière de la boutique */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Bannière de couverture
              </label>
              <ImageUpload
                folder="rohaty-shop/stores/banner"
                currentUrl={bannerUrl}
                onUpload={(url) => setBannerUrl(url)}
                onClear={() => setBannerUrl(null)}
                aspectRatio="banner"
              />
              <p className="text-[11px] text-slate-500">
                Format paysage (ratio 3:1 recommandé, ex: 1200x400 pixels). S&apos;affiche en haut de votre vitrine.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6 space-y-6 bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Paintbrush className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-base font-bold text-slate-900">Charte Graphique</h2>
            </div>

            {/* Section Thèmes */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Choisir un thème
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Sélectionnez un style de départ pré-configuré pour votre vitrine SaaS.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(STORE_THEMES).map(([key, theme]) => {
                  const isActive = normalizeKey(key) === activeThemeKey
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectTheme(key, theme)}
                      className={cn(
                        'flex flex-col gap-3 p-3.5 rounded-xl border transition-all text-left w-full cursor-pointer',
                        isActive
                          ? 'bg-blue-50/50 border-[#2563EB] shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                      )}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-bold text-slate-900">{theme.name}</span>
                        {isActive && (
                          <span className="font-bold text-[#2563EB] bg-blue-100/70 px-2 py-0.5 rounded text-[10px]">
                            Actif
                          </span>
                        )}
                      </div>

                      {/* Couleur prévisualisation */}
                      <div className="flex gap-2 p-2 rounded-lg items-center w-full" style={{ backgroundColor: theme.pageColor }}>
                        <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: theme.primaryColor }} title="Principale" />
                        <span className="w-4 h-4 rounded-md border border-black/10 shrink-0" style={{ backgroundColor: theme.cardColor }} title="Cartes" />
                        <span className="text-[10px] font-bold leading-none shrink-0" style={{ color: theme.textColor }}>Abc</span>
                        <span className="text-[10px] font-medium leading-none shrink-0" style={{ color: theme.secondaryTextColor }}>Abc</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Personnalisation avancée */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Personnalisation avancée</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ajustez les couleurs individuellement pour affiner l&apos;identité visuelle de votre vitrine.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ColorField
                  label="Couleur principale (Thème)"
                  value={colors.primary}
                  onChange={(v) => updateColor('primary', v)}
                />
                <ColorField
                  label="Couleur de fond vitrine"
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
            </div>
          </GlassCard>
        </div>

        {/* Aperçu en direct (Droite) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Aperçu en temps réel
            </label>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              <Laptop className="w-3.5 h-3.5" />
              Vitrine SaaS
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-md relative" style={{ backgroundColor: colors.page }}>
            {/* Mock Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden relative">
                    <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: colors.primary, color: '#fff' }}>
                    {store.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-xs truncate max-w-[120px]" style={{ color: colors.text }}>
                  {store.name}
                </span>
              </div>
            </div>

            {/* Mock Banner */}
            {bannerUrl && (
              <div className="w-full h-20 relative">
                <Image src={bannerUrl} alt="Bannière" fill className="object-cover" />
              </div>
            )}

            {/* Mock Content */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl border" style={{ backgroundColor: colors.card, borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="aspect-square rounded-lg flex items-center justify-center text-[10px] mb-2" style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: colors.secondaryText }}>
                    Produit A
                  </div>
                  <p className="text-[11px] font-bold truncate" style={{ color: colors.text }}>Article Exemple</p>
                  <p className="text-xs font-extrabold mt-0.5" style={{ color: colors.primary }}>8 500 DJF</p>
                </div>
                <div className="p-2 rounded-xl border" style={{ backgroundColor: colors.card, borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="aspect-square rounded-lg flex items-center justify-center text-[10px] mb-2" style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: colors.secondaryText }}>
                    Produit B
                  </div>
                  <p className="text-[11px] font-bold truncate" style={{ color: colors.text }}>Autre Article</p>
                  <p className="text-xs font-extrabold mt-0.5" style={{ color: colors.primary }}>12 000 DJF</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action final bar */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition shadow-xs flex items-center justify-center disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Mise à jour...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer l&apos;apparence
            </>
          )}
        </button>
      </div>
    </form>
  )
}
