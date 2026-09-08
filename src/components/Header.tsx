"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, LayoutGrid, LogIn, ArrowLeft } from "lucide-react";
import { SITE_LOGO_URL } from "@/lib/constants";

interface HeaderProps {
  adCount?: number;
}

export default function Header({ adCount = 632 }: HeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-slate-200 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ===== MOBILE / TABLETTE (< lg) : 2 étages, fidèle aux maquettes ===== */}
        <div className="lg:hidden py-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            {!isHome ? (
              <Link
                href="/"
                className="flex items-center gap-1 text-slate-700 hover:text-brand-pink-600 font-bold text-sm transition-colors mr-1 min-h-11 -ml-1 pl-1 pr-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Retour</span>
              </Link>
            ) : null}

            <Logo />

            <Link
              href="/annonces/nouvelle"
              className="flex items-center gap-1.5 px-4 min-h-11 rounded-xl bg-brand-pink-500 hover:bg-brand-pink-600 active:scale-95 text-white text-sm font-extrabold shadow-card transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
              <span>Publier</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 min-h-11 px-3 rounded-xl border border-rose-300 hover:bg-rose-50/50 text-rose-800 text-xs sm:text-sm font-bold transition-colors shadow-sm bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
            >
              <LayoutGrid className="w-4 h-4 text-rose-600" aria-hidden="true" />
              <span>{adCount} annonces</span>
            </Link>

            <Link
              href="/connexion"
              className="flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-xl bg-brand-blue-800 hover:bg-brand-blue-900 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600 focus-visible:ring-offset-2"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Se connecter</span>
            </Link>
          </div>
        </div>

        {/* ===== DESKTOP (>= lg) : une seule ligne qui exploite la largeur ===== */}
        <div className="hidden lg:flex items-center justify-between gap-6 py-3">
          <div className="flex items-center gap-8">
            {!isHome && (
              <Link
                href="/"
                className="flex items-center gap-1.5 text-slate-600 hover:text-brand-pink-600 font-semibold text-sm transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Retour</span>
              </Link>
            )}
            <Logo />
            <nav aria-label="Navigation principale" className="flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-bold text-slate-600 hover:text-brand-blue-900 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
              >
                Accueil
              </Link>
              <Link
                href="/"
                className="flex items-center gap-1.5 text-sm font-bold text-rose-800 hover:text-brand-pink-600 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
              >
                <LayoutGrid className="w-4 h-4 text-rose-600" aria-hidden="true" />
                <span>{adCount} annonces</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/connexion"
              className="flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-brand-blue-800 text-brand-blue-800 hover:bg-brand-blue-50 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600 focus-visible:ring-offset-2"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Se connecter</span>
            </Link>
            <Link
              href="/annonces/nouvelle"
              className="flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-brand-pink-500 hover:bg-brand-pink-600 active:scale-[0.98] text-white text-sm font-extrabold shadow-card hover:shadow-glow-pink transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
              <span>Publier une annonce</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center flex-shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- logo hébergé sur Supabase Storage, hors domaines optimisés par défaut */}
      <img src={SITE_LOGO_URL} alt="Kiaba Rencontre" className="h-9 sm:h-10 w-auto" />
    </Link>
  );
}
