"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Sparkles, ArrowRight, AlertCircle } from "lucide-react";
import PasswordField from "@/components/PasswordField";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Veuillez remplir tous les champs.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Email ou mot de passe incorrect.");
        return;
      }
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : "/profil");
      router.refresh();
    } catch {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-tr from-brand-pink-500 to-brand-blue-800 flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-slate-900">
          Connexion à votre compte
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gérez vos annonces, vos boosts et consultez vos statistiques
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Adresse email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre-email@exemple.com"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Mot de passe
            </label>
            <Link href="/mot-de-passe-oublie" className="text-[11px] text-brand-pink-600 hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <PasswordField
            value={password}
            onChange={setPassword}
            placeholder="Votre mot de passe"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 hover:from-brand-pink-600 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span>Connexion en cours...</span>
          ) : (
            <>
              <span>Se connecter</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-500 pt-2">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-brand-pink-600 font-bold hover:underline">
            Créer un compte (1ère annonce offerte)
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-slate-500">Chargement...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
