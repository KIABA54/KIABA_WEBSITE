"use client";

import { useState } from "react";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import type { FormulaId } from "@/lib/types";

interface AdGalleryProps {
  photos: string[];
  title: string;
  formula: FormulaId;
  isBoosted: boolean;
}

export default function AdGallery({ photos, title, formula, isBoosted }: AdGalleryProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800">
      <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full">
        <img
          src={photos[activePhotoIdx]}
          alt={title}
          className="w-full h-full object-contain sm:object-cover"
        />

        {/* BADGE FORMULE OFFICIEL */}
        <div className="absolute top-3 left-3">
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
              onClick={() => setActivePhotoIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActivePhotoIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicateur 1/X */}
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-[11px] font-bold text-white">
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
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
