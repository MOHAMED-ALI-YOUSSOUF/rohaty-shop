// components/shared/GradientButton.tsx
'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'outline' | 'whatsapp'

interface GradientButtonProps {
  variant?: Variant
  href?: string
  target?: string
  rel?: string
  onClick?: () => void
  children: React.ReactNode
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const variantClasses: Record<Variant, string> = {
  primary: [
    'bg-gradient-to-r from-[#2563EB] to-[#06B6D4]',
    'text-white font-semibold',
    'hover:scale-[1.03] hover:shadow-[0_8px_32px_rgba(37,99,235,0.4)]',
    'active:scale-[0.98]',
    'transition-all duration-200',
  ].join(' '),

  outline: [
    'border border-[#2563EB] text-[#2563EB]',
    'hover:bg-[#2563EB]/10',
    'transition-all duration-200',
  ].join(' '),

  whatsapp: [
    'bg-[#10B981] text-white font-semibold',
    'whatsapp-pulse',
    'hover:bg-[#059669] hover:scale-[1.02]',
    'active:scale-[0.98]',
    'transition-all duration-200',
  ].join(' '),
}

export function GradientButton({
  variant = 'primary',
  href,
  target,
  rel,
  onClick,
  children,
  className,
  disabled,
  type = 'button',
}: GradientButtonProps) {
  const base = cn(
    'inline-flex items-center justify-center gap-2',
    'px-6 py-3 rounded-lg text-sm font-semibold',
    'cursor-pointer select-none',
    variantClasses[variant],
    disabled && 'opacity-50 pointer-events-none',
    className
  )

  if (href) {
    return (
      <Link href={href} target={target} rel={rel} className={base}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>
      {children}
    </button>
  )
}
