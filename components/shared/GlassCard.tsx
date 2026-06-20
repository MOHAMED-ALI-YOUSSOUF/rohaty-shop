// components/shared/GlassCard.tsx
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div className={cn('glass card-glow rounded-xl', className)}>
      {children}
    </div>
  )
}
