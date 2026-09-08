"use client";

import Link from "next/link";
import {
  User,
  Gem,
  MapPin,
  ShieldCheck,
  Clock,
  MessageCircle,
  Phone,
  SearchX,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Ad } from "@/lib/types";
import { FORMULAS } from "@/lib/constants";

interface AdCardProps {
  ad: Ad;
}

export default function AdCard({ ad }: AdCardProps) {
  const getRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `il y a : ${Math.max(1, diffMin)} minutes`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a : ${diffH} heures`;
    const diffD = Math.floor(diffH / 24);
    return `il y a : ${diffD} jours`;
  };

  const cleanPhone = ad.phone_number.replace(/\s+/g, "");
  const formula = FORMULAS[ad.formula];
  const showRibbon = ad.formula === "VIP" || ad.formula === "PRO_PLUS" || ad.formula === "PRO";

  return (
    <div className="w-full max-w-2xl bg-[#FFF8F6] rounded-2xl p-3 border-2 border-rose-300 shadow-card transition-all hover:border-brand-pink-400 hover:shadow-card-hover space-y-2">
      <div className="flex gap-3">
        {/* VIGNETTE PHOTO */}
        <Link
          href={`/annonces/${ad.id}`}
          className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
        >
          <img
            src={ad.photos[0]}
            alt={ad.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {showRibbon && (
            <div className="absolute top-1.5 left-1.5">
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] uppercase shadow-sm ${formula.badgeColor}`}
              >
                {formula.badgeLabel}
              </span>
            </div>
          )}
        </Link>

        {/* COLONNE D'INFORMATIONS */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <Link
              href={`/annonces/${ad.id}`}
              className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500"
            >
              <h3 className="text-xs sm:text-sm font-extrabold text-brand-blue-900 line-clamp-2 leading-tight hover:text-brand-pink-600 transition-colors mb-1.5">
                {ad.title}
              </h3>
            </Link>

            <div className="flex items-center gap-1 text-2xs text-slate-600 mb-1">
              <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">
                Publié par{" "}
                <strong className="text-brand-blue-700 font-extrabold">
                  {ad.user?.username || "Utilisateur"}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1 text-2xs text-slate-600 mb-1">
              <Gem className="w-3.5 h-3.5 text-brand-cyan-400 flex-shrink-0" aria-hidden="true" />
              <span className="truncate font-medium capitalize">
                {ad.category === "escorte-girl" ? "Rencontres - escortes" : ad.category.replace("-", " ")}
              </span>
            </div>

            <div className="flex items-center gap-1 text-2xs text-slate-600 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" aria-hidden="true" />
              <span className="font-semibold text-slate-800 truncate">{ad.city}</span>
              {ad.address && (
                <span className="text-amber-500 font-bold flex items-center gap-0.5 truncate">
                  ⚡ {ad.address}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 text-2xs font-black uppercase text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>Certifié</span>
              </span>

              {ad.is_boosted && (
                <span className="px-2 py-0.5 rounded-md text-3xs font-black uppercase tracking-wider bg-red-600 text-white shadow-sm">
                  Urgent
                </span>
              )}
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-2xs">
            <span className="font-extrabold text-brand-blue-600">{formula.name}</span>
            <div className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" aria-hidden="true" />
              <span>{getRelativeTime(ad.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTACT RAPIDE */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rose-200/60">
        <a
          href={`https://wa.me/${cleanPhone}?text=Bonjour%20vu%20sur%20KIABA%20RENCONTRE`}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-11 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
          <span>WhatsApp</span>
        </a>

        <a
          href={`tel:${cleanPhone}`}
          className="min-h-11 px-3 rounded-xl bg-brand-blue-700 hover:bg-brand-blue-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600 focus-visible:ring-offset-2"
        >
          <Phone className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
          <span>Appeler</span>
        </a>
      </div>
    </div>
  );
}

/**
 * Placeholder affiché pendant le chargement d'une liste d'annonces.
 * Même gabarit qu'AdCard pour éviter tout saut de mise en page (CLS).
 */
export function AdCardSkeleton() {
  return (
    <div
      className="w-full max-w-2xl bg-white rounded-2xl p-3 border-2 border-slate-100 shadow-card space-y-2 animate-pulse"
      role="status"
      aria-label="Chargement de l'annonce"
    >
      <div className="flex gap-3">
        <div className="skeleton w-28 h-36 sm:w-32 sm:h-40 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="space-y-2">
            <div className="skeleton h-3.5 rounded-md w-11/12" />
            <div className="skeleton h-3.5 rounded-md w-3/4" />
            <div className="skeleton h-2.5 rounded-md w-2/3" />
            <div className="skeleton h-2.5 rounded-md w-1/2" />
          </div>
          <div className="skeleton h-2.5 rounded-md w-1/3" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
        <div className="skeleton h-11 rounded-xl" />
        <div className="skeleton h-11 rounded-xl" />
      </div>
    </div>
  );
}

interface AdListStateProps {
  variant: "empty" | "error";
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * État "aucune annonce trouvée" / erreur de chargement, à afficher à la place de la grille
 * d'AdCard quand la liste est vide ou que la requête a échoué.
 */
export function AdListState({ variant, title, message, onRetry }: AdListStateProps) {
  const isError = variant === "error";
  const Icon = isError ? AlertTriangle : SearchX;

  return (
    <div
      role={isError ? "alert" : "status"}
      className="w-full flex flex-col items-center text-center gap-3 py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white"
    >
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center ${
          isError ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-400"
        }`}
      >
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-extrabold text-slate-800">
          {title || (isError ? "Une erreur est survenue" : "Aucune annonce trouvée")}
        </p>
        <p className="text-xs text-slate-500 max-w-xs">
          {message ||
            (isError
              ? "Impossible de charger les annonces pour le moment. Veuillez réessayer."
              : "Essayez d'élargir votre recherche ou de modifier vos filtres.")}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 min-h-11 px-4 rounded-xl bg-brand-blue-800 hover:bg-brand-blue-900 text-white text-xs font-bold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600 focus-visible:ring-offset-2"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Réessayer</span>
        </button>
      )}
    </div>
  );
}
