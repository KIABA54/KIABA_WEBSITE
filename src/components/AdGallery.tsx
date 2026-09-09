"use client";

import { useEffect, useState } from "react";
import { Sparkles, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { FormulaId } from "@/lib/types";

interface AdGalleryProps {
  photos: string[];
  title: string;
  formula: FormulaId;
  isBoosted: boolean;
}

export default function AdGallery({ photos, title, formula, isBoosted }: AdGalleryProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const goPrev = () => setActivePhotoIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  const goNext = () => setActivePhotoIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1));

  // Verrouille le défilement de la page et permet de fermer / naviguer au
  // clavier tant que la visionneuse plein écran est ouverte.
  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen, photos.length]);

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800">
      <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute inset-0 w-full h-full cursor-zoom-in group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-inset"
          aria-label={`Agrandir la photo ${activePhotoIdx + 1} sur ${photos.length}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- photo hébergée sur Supabase Storage (ou Unsplash pour le placeholder), hors domaines optimisés par défaut — voir next.config.ts */}
          <img
            src={photos[activePhotoIdx]}
            alt={title}
            className="w-full h-full object-contain sm:object-cover"
          />
          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="w-11 h-11 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ZoomIn className="w-5 h-5" aria-hidden="true" />
            </span>
          </span>
        </button>

        {/* BADGE FORMULE OFFICIEL */}
        <div className="absolute top-3 left-3 pointer-events-none">
          {formula === "VIP" && (
            <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-brand-pink-500 to-brand-pink-700 text-white shadow-lg flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-white" />
              <span>ANNONCE VIP</span>
            </span>
          )}
          {formula === "PRO_PLUS" && (
            <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-gradient-to-r from-brand-pink-500 to-brand-blue-800 text-white shadow-lg">
              ANNONCE PRO (+)
            </span>
          )}
          {formula === "PRO" && (
            <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-brand-blue-800 text-white shadow-lg">
              ANNONCE PRO
            </span>
          )}
          {isBoosted && (
            <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-lg ml-1">
              BOOSTÉE ⚡
            </span>
          )}
        </div>

        {/* NAVIGATION FLECHES SI MULTIPLES PHOTOS */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
              aria-label="Photo suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicateur 1/X */}
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-[11px] font-bold text-white pointer-events-none">
              {activePhotoIdx + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {/* THUMBNAILS SI PLUSIEURS PHOTOS */}
      {photos.length > 1 && (
        <div className="p-2 bg-slate-950 flex gap-2 overflow-x-auto justify-center">
          {photos.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setActivePhotoIdx(idx)}
              className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                activePhotoIdx === idx
                  ? "border-brand-pink-500 scale-105"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- photo hébergée sur Supabase Storage (ou Unsplash pour le placeholder), hors domaines optimisés par défaut — voir next.config.ts */}
              <img src={url} alt={`${title} — photo ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* VISIONNEUSE PLEIN ÉCRAN */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${activePhotoIdx + 1} sur ${photos.length} — ${title}`}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-8 animate-in fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Fermer la visionneuse"
          >
            <X className="w-5 h-5" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element -- photo hébergée sur Supabase Storage (ou Unsplash pour le placeholder), hors domaines optimisés par défaut — voir next.config.ts */}
          <img
            src={photos[activePhotoIdx]}
            alt={title}
            className="max-w-full max-h-full object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Photo précédente"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Photo suivante"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-[11px] font-bold text-white">
                {activePhotoIdx + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
