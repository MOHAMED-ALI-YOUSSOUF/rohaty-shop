// components/shared/GlassCard.tsx
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div className={cn('bg-white border border-slate-200 shadow-xs rounded-2xl', className)}>
      {children}
    </div>
  )
}
