"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, LayoutGrid, LogIn, ArrowLeft, Heart } from "lucide-react";

interface HeaderProps {
  adCount?: number;
}

export default function Header({ adCount = 632 }: HeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-lg mx-auto px-3 sm:px-4 py-2 space-y-2">
        {/* ÉTAGE 1 : LOGO & BOUTON "+ PUBLIER" */}
        <div className="flex items-center justify-between gap-2">
          {/* Bouton Retour si on est sur une page interne (comme sur la capture 4) */}
          {!isHome ? (
            <Link
              href="/"
              className="flex items-center gap-1 text-slate-700 hover:text-brand-pink-600 font-bold text-sm transition-colors mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </Link>
          ) : null}

          {/* LOGO KIABA RENCONTRE (inspiré Moosso en Rose & Bleu) */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-pink-500 to-brand-blue-800 flex items-center justify-center text-white shadow-sm">
              <Heart className="w-5 h-5 fill-white text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight leading-none text-brand-blue-950">
                Kiaba<span className="text-brand-pink-500">.</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                Rencontres
              </span>
            </div>
          </Link>

          {/* BOUTON + PUBLIER (Rose Fuchsia vibrant, exactement positionné comme sur les captures) */}
          <Link
            href="/annonces/nouvelle"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-pink-500 hover:bg-brand-pink-600 active:scale-95 text-white text-sm font-extrabold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Publier</span>
          </Link>
        </div>

        {/* ÉTAGE 2 : COMPTEUR D'ANNONCES & BOUTON SE CONNECTER (Identique aux captures) */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {/* Bouton Compteur d'annonces */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-rose-300 hover:bg-rose-50/50 text-rose-800 text-xs sm:text-sm font-bold transition-colors shadow-sm bg-white"
          >
            <LayoutGrid className="w-4 h-4 text-rose-600" />
            <span>{adCount} annonces</span>
          </Link>

          {/* Bouton Se connecter / Mon Compte */}
          <Link
            href="/connexion"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-blue-800 hover:bg-brand-blue-900 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Se connecter</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
