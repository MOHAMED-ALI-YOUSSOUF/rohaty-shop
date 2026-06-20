// components/shared/SectionTitle.tsx
'use client'

import { cn } from '@/lib/utils'

interface SectionTitleProps {
  eyebrow?: string
  children: React.ReactNode
  gradient?: boolean
  className?: string
  center?: boolean
}

export function SectionTitle({
  eyebrow,
  children,
  gradient = false,
  className,
  center = true,
}: SectionTitleProps) {
  return (
    <div className={cn('mb-12', center && 'text-center', className)}>
      {eyebrow && (
        <p className="text-xs font-semibold tracking-widest uppercase text-[#06B6D4] mb-3">
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          'text-4xl md:text-5xl font-bold title-underline',
          gradient ? 'gradient-text' : 'text-white',
          center && 'inline-block'
        )}
      >
        {children}
      </h2>
    </div>
  )
}
