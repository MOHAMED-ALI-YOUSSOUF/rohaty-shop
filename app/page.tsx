// app/page.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ShoppingBag,
  Store,
  Zap,
  Share2,
  Smartphone,
  Palette,
  MessageSquare,
  Check,
  ArrowRight,
  Star,
  CheckCircle,
  Laptop,
  Flame,
} from 'lucide-react'
import { GradientButton } from '@/components/shared/GradientButton'
import { GlassCard } from '@/components/shared/GlassCard'
import { SectionTitle } from '@/components/shared/SectionTitle'
import { fadeUp, fadeIn, stagger, zoomIn } from '@/lib/animations'

export default function LandingPage() {
  const steps = [
    {
      number: '01',
      title: 'Créez votre boutique',
      desc: 'Renseignez le nom de votre commerce, choisissez votre URL personnalisée et indiquez votre numéro WhatsApp en moins de 2 minutes.',
    },
    {
      number: '02',
      title: 'Ajoutez vos produits',
      desc: 'Téléversez les photos de vos articles, indiquez leurs prix (et prix barrés pour les promos), classez-les par catégorie en toute simplicité.',
    },
    {
      number: '03',
      title: 'Recevez les commandes',
      desc: 'Partagez votre lien sur vos réseaux sociaux. Vos clients parcourent votre catalogue et commandent en direct sur votre WhatsApp.',
    },
  ]

  const features = [
    {
      icon: <Store className="w-6 h-6 text-primary" />,
      title: 'Boutique personnalisée',
      desc: 'Définissez votre propre logo, votre bannière et votre couleur de marque pour refléter parfaitement votre identité.',
    },
    {
      icon: <ShoppingBag className="w-6 h-6 text-secondary" />,
      title: 'Catalogue illimité',
      desc: 'Ajoutez tous vos articles avec images haute définition, descriptions détaillées et filtres de catégories.',
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-emerald-400" />,
      title: 'Commandes WhatsApp directes',
      desc: 'Vos clients cliquent sur commander et un message WhatsApp pré-rempli s’ouvre avec la photo et les détails exacts du produit.',
    },
    {
      icon: <Share2 className="w-6 h-6 text-accent" />,
      title: 'Lien unique & partageable',
      desc: 'Obtenez une adresse propre type shop.rohaty.com/ma-boutique, facile à ajouter dans votre bio Instagram ou TikTok.',
    },
    {
      icon: <Smartphone className="w-6 h-6 text-warning" />,
      title: 'Expérience 100% Mobile',
      desc: 'Conçu en Mobile-First. Vos clients naviguent avec une rapidité incroyable, augmentant considérablement vos ventes.',
    },
    {
      icon: <Palette className="w-6 h-6 text-red-400" />,
      title: 'Thèmes et couleurs épurés',
      desc: 'Choisissez parmi nos thèmes prédéfinis ou configurez votre propre code couleur hexadécimal pour un rendu unique.',
    },
  ]

  return (
    <div className="min-h-screen bg-bg-base text-white flex flex-col overflow-x-hidden font-sans">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="p-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <span className="font-heading font-extrabold text-lg tracking-wider text-white">
              ROHATY <span className="gradient-text">SHOP</span>
            </span>
          </Link>

          {/* Navigation CTAs */}
          <div className="flex items-center gap-4">
            <Link
              href="/connexion"
              className="text-xs sm:text-sm font-semibold text-text-secondary hover:text-white transition-colors"
            >
              Connexion
            </Link>
            <GradientButton
              variant="primary"
              href="/inscription"
              className="py-2 px-4 text-xs sm:text-sm font-bold shadow-sm"
            >
              Créer ma boutique →
            </GradientButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-10 pb-20 md:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero text */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-secondary"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>✨ Création de boutique en 5 minutes</span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-6xl font-black font-heading leading-tight tracking-tight text-white"
            >
              Votre boutique en ligne, vos clients commandent via <span className="text-success">WhatsApp</span>.
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Créez votre vitrine e-commerce ultra-rapide. Partagez votre lien unique sur vos réseaux sociaux, et recevez directement les commandes sur votre messagerie. Sans commission, sans intermédiaire.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <GradientButton
                variant="primary"
                href="/inscription"
                className="w-full sm:w-auto px-8 py-4 text-base font-bold shadow-lg"
              >
                Créer ma boutique gratuitement
              </GradientButton>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all"
              >
                Comment ça fonctionne
              </a>
            </motion.div>

            {/* Stats list */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/5"
            >
              <div>
                <p className="text-2xl font-black font-heading gradient-text">+200</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">
                  Boutiques
                </p>
              </div>
              <div>
                <p className="text-2xl font-black font-heading text-secondary">5 min</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">
                  Configuration
                </p>
              </div>
              <div>
                <p className="text-2xl font-black font-heading text-accent">0%</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">
                  Commission
                </p>
              </div>
              <div>
                <p className="text-2xl font-black font-heading text-success">WhatsApp</p>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">
                  Natif
                </p>
              </div>
            </motion.div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="lg:col-span-6 flex justify-center relative">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={zoomIn}
              className="relative w-full max-w-[480px] aspect-[4/3] rounded-2xl border border-white/15 bg-bg-surface overflow-hidden shadow-2xl"
            >
              {/* Mockup Dashboard browser */}
              <div className="bg-bg-surface border-b border-white/5 px-4 py-3 flex items-center gap-1.5 text-xs select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <div className="bg-bg-input rounded px-3 py-0.5 text-[10px] text-text-secondary font-mono mx-auto select-none">
                  shop.rohaty.com/dashboard
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="h-6 w-32 bg-white/5 rounded" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-16 bg-white/5 rounded-lg border border-white/5" />
                  <div className="h-16 bg-white/5 rounded-lg border border-white/5" />
                  <div className="h-16 bg-white/5 rounded-lg border border-white/5" />
                </div>
                <div className="h-24 bg-white/5 rounded-lg border border-white/5" />
              </div>

              {/* Mockup Storefront overlapping Phone */}
              <div className="absolute right-6 bottom-[-20px] w-[180px] h-[280px] rounded-t-3xl border border-white/20 bg-bg-base overflow-hidden shadow-2xl flex flex-col z-20 select-none">
                <div className="bg-bg-surface py-2.5 border-b border-white/5 flex justify-center">
                  <span className="w-12 h-3.5 rounded-full bg-black/60" />
                </div>
                <div className="h-10 bg-gradient-to-r from-primary to-secondary opacity-60" />
                <div className="p-3 space-y-2">
                  <div className="w-8 h-8 rounded bg-bg-surface border border-white/5 -mt-6" />
                  <div className="h-3 w-16 bg-white/10 rounded" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="aspect-square bg-white/5 rounded-lg border border-white/5" />
                    <div className="aspect-square bg-white/5 rounded-lg border border-white/5" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section
        id="how-it-works"
        className="py-20 md:py-32 bg-bg-muted/40 border-y border-white/5 scroll-mt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              FONCTIONNEMENT
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-white title-underline">
              Vendez en 3 étapes simples
            </h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {steps.map((step, idx) => (
              <motion.div key={idx} variants={fadeUp} className="relative group space-y-4">
                <div className="text-6xl md:text-7xl font-black font-heading text-white/5 select-none transition-colors duration-300 group-hover:text-primary/10">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-white font-heading">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
            CARACTÉRISTIQUES
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-white title-underline">
            Tout ce dont vous avez besoin
          </h2>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((feat, idx) => (
            <motion.div key={idx} variants={fadeUp}>
              <GlassCard className="p-6 h-full flex flex-col justify-between space-y-4 card-glow transition-all duration-300">
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5 w-fit">
                    {feat.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white font-heading">{feat.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{feat.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 md:py-32 bg-bg-muted/40 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">
              TARIFS SIMPLES
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-white title-underline">
              Choisissez votre formule
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card Plan 1: Gratuit */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <GlassCard className="p-8 border border-white/5 flex flex-col justify-between h-full space-y-8 hover:border-white/10 transition-colors">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white font-heading">Plan Gratuit</h3>
                    <p className="text-xs text-text-secondary mt-1">Idéal pour démarrer</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black font-heading text-white">0</span>
                    <span className="text-sm font-semibold text-text-secondary uppercase">
                      DJF / mois
                    </span>
                  </div>
                  <ul className="space-y-3.5 text-sm text-text-secondary">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Jusqu'à 10 produits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Lien personnalisé unique</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Commandes WhatsApp illimitées</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Hébergement Cloudinary inclus</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/inscription"
                  className="w-full py-3.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-all text-center"
                >
                  Démarrer gratuitement
                </Link>
              </GlassCard>
            </motion.div>

            {/* Card Plan 2: Pro */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="relative"
            >
              {/* Highlight badge */}
              <span className="absolute -top-3.5 right-6 bg-gradient-to-r from-primary to-secondary text-white text-[10px] font-bold tracking-widest uppercase px-3.5 py-1 rounded-full shadow-lg flex items-center gap-1 z-10 select-none animate-bounce">
                <Star className="w-3 h-3 fill-current" /> Recommandé
              </span>

              <GlassCard className="p-8 border border-primary/30 bg-primary/5 flex flex-col justify-between h-full space-y-8 shadow-[0_12px_40px_rgba(37,99,235,0.15)]">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white font-heading">Formule Pro</h3>
                    <p className="text-xs text-text-secondary mt-1">Pour les commerçants sérieux</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black font-heading text-white">5 000</span>
                    <span className="text-sm font-semibold text-text-secondary uppercase">
                      DJF / mois
                    </span>
                  </div>
                  <ul className="space-y-3.5 text-sm text-text-secondary">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-white font-semibold">Produits illimités</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Catégories personnalisées</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Personnalisation visuelle complète</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Support prioritaire 24/7</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Statistiques de visite basiques (À venir)</span>
                    </li>
                  </ul>
                </div>
                <GradientButton
                  variant="primary"
                  href="/inscription"
                  className="w-full py-3.5 text-sm font-bold shadow-lg"
                >
                  Passer au Plan Pro
                </GradientButton>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 relative text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={zoomIn}
          className="space-y-8 relative z-10"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading text-white">
            Prêt à vendre vos produits en ligne ?
          </h2>
          <p className="text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
            Rejoignez des centaines de commerçants qui simplifient leur commerce et augmentent leurs ventes grâce au système de commande WhatsApp de Rohaty Shop.
          </p>
          <div className="flex justify-center">
            <GradientButton
              variant="primary"
              href="/inscription"
              className="px-10 py-4 text-base font-bold shadow-2xl hover:scale-105 transition-all"
            >
              Créer ma boutique gratuitement →
            </GradientButton>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-bg-muted/50 py-12 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-gradient-to-r from-primary to-secondary text-white">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <span className="font-heading font-extrabold text-sm tracking-wider text-white">
              ROHATY <span className="gradient-text">SHOP</span>
            </span>
          </div>

          <p className="text-xs text-text-muted text-center md:text-right">
            © {new Date().getFullYear()} Rohaty Digital. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}