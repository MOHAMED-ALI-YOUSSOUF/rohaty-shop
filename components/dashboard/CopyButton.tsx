// components/dashboard/CopyButton.tsx
'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CopyButtonProps {
  text: string
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-95 transition-all text-slate-700 shrink-0"
      title="Copier le lien"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400">Copié !</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-text-secondary" />
          <span>Copier</span>
        </>
      )}
    </button>
  )
}
