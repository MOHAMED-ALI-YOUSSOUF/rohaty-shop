// app/connexion/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { GradientButton } from '@/components/shared/GradientButton'
import { GlassCard } from '@/components/shared/GlassCard'
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'



export default function ResetPage() {



    const resetPassword = async () => {
        const res = await fetch('/api/admin/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: '',
                password: '',
            }),
        })

        const data = await res.json()

        if (data.success) {
            alert('Mot de passe modifié')
        } else {
            alert(data.error)
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-[#0F172A]">
            {/* Background gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none" />
            {/* Logo */}
            <div className="mb-8 text-center z-10">
                <Link href="/" className="font-heading text-3xl font-extrabold tracking-tight">
                    Rohaty <span className="gradient-text">Shop</span>
                </Link>
                <p className="text-text-secondary text-sm mt-2">
                    Réinitialiser le mot de passe 
                </p>
            </div>
            <GradientButton onClick={resetPassword} disabled>
                Réinitialiser le mot de passe
            </GradientButton>

        </div>
    )
}
