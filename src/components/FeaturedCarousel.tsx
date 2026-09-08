"use client";

import Link from "next/link";
import { Star, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Ad } from "@/lib/types";
import { useRef } from "react";

interface FeaturedCarouselProps {
  ads: Ad[];
}

export default function FeaturedCarousel({ ads }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const featuredAds = ads.filter((a) => a.formula === "VIP" || a.formula === "PRO_PLUS" || a.is_boosted);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -160, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 160, behavior: "smooth" });
  };

  return (
    <div className="w-full space-y-2 py-2">
      {/* HEADER SECTION ÉTOILES (REPRODUCTION STRICTE CAPTURE 3) */}
      <div>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 fill-[#FBBF24] text-[#FBBF24]" />
          <h2 className="text-base sm:text-lg font-black text-[#1E3A8A] tracking-tight">
            Vos Annonces Étoiles
          </h2>
        </div>
        <p className="text-[10px] font-extrabold tracking-widest uppercase text-[#DC2626] ml-7">
          33 ANNONCES ÉTOILES EN LIGNE
        </p>
      </div>

      {/* CARROUSEL DES CARTES PORTRAIT */}
      <div className="relative group">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        >
          {featuredAds.map((ad) => (
            <Link
              key={ad.id}
              href={`/annonces/${ad.id}`}
              className="relative flex-shrink-0 w-36 sm:w-40 h-56 sm:h-64 rounded-2xl overflow-hidden shadow-sm border border-slate-200 snap-start block group/card"
            >
              <img
                src={ad.photos[0]}
                alt={ad.title}
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                loading="lazy"
              />

              {/* Étoile jaune en haut à droite */}
              <div className="absolute top-2 right-2">
                <Star className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24] drop-shadow" />
              </div>

              {/* Pastille rouge Ville en bas à gauche */}
              <div className="absolute bottom-2 left-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DC2626] text-white shadow">
                  <MapPin className="w-3 h-3 fill-current" />
                  <span>{ad.city}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Flèches de défilement discrètes */}
        <button
          onClick={scrollLeft}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow text-slate-700 flex items-center justify-center hover:bg-white transition-all z-10"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={scrollRight}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow text-slate-700 flex items-center justify-center hover:bg-white transition-all z-10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* BOUTON "VOIR LE MUR ÉTOILÉ" (CONFORME CAPTURE 3) */}
      <div className="pt-1 text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 px-6 py-2 rounded-xl bg-white border border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50 text-xs font-extrabold shadow-sm transition-all"
        >
          <Star className="w-3.5 h-3.5 fill-[#1E3A8A]" />
          <span>Voir le mur étoilé</span>
        </Link>
      </div>
    </div>
  );
}
