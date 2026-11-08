// app/connexion/page.tsx
"use client";

import { GradientButton } from "@/components/shared/GradientButton";

import Link from "next/link";

export default function ResetPage() {
  const resetPassword = async () => {
    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "1e357948-cd85-4cd1-a99b-307b96849c06",
        password: "Med12345",
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Mot de passe modifié");
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center z-10">
        <Link
          href="/"
          className="font-heading text-3xl font-extrabold tracking-tight"
        >
          Rohaty <span className="gradient-text">Shop</span>
        </Link>
        <p className="text-text-secondary text-sm mt-2">
          Réinitialiser le mot de passe
        </p>
      </div>
      <GradientButton onClick={resetPassword} >
        Réinitialiser le mot de passe
      </GradientButton>
    </div>
  );
}
