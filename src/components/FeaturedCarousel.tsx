"use client";

import Link from "next/link";
import { Star, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Ad } from "@/lib/types";
import { useRef } from "react";

interface FeaturedCarouselProps {
  ads: Ad[];
}

const CARD_STEP = 168;

export default function FeaturedCarousel({ ads }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Le carrousel "Annonces Étoiles" est un avantage propre à la formule VIP
  // (voir README : "mise en avant permanente + carrousel VIP") — il ne doit
  // pas être dilué par les annonces Pro(+) ou simplement boostées, sinon
  // l'avantage VIP perd sa valeur.
  const featuredAds = ads.filter((a) => a.formula === "VIP");

  const scrollByStep = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * CARD_STEP, behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByStep(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByStep(-1);
    }
  };

  return (
    <div className="w-full space-y-2 py-2">
      <div>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" aria-hidden="true" />
          <h2 className="text-base sm:text-lg font-black text-brand-blue-900 tracking-tight">
            Vos Annonces Étoiles
          </h2>
        </div>
        <p className="text-3xs font-extrabold tracking-widest uppercase text-red-600 ml-7">
          {featuredAds.length} annonces étoiles en ligne
        </p>
      </div>

      {featuredAds.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-8 px-4 text-center">
          <p className="text-sm font-semibold text-slate-500">
            Aucune annonce étoile pour le moment.
          </p>
        </div>
      ) : (
        <div className="relative group">
          <div
            ref={scrollRef}
            role="region"
            aria-label="Annonces étoiles, glisser pour parcourir"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-none scroll-fade-x snap-x snap-mandatory rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
          >
            {featuredAds.map((ad) => (
              <Link
                key={ad.id}
                href={`/annonces/${ad.id}`}
                className="relative flex-shrink-0 w-36 sm:w-40 h-56 sm:h-64 rounded-2xl overflow-hidden shadow-card border border-slate-200 snap-start block group/card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
              >
                <img
                  src={ad.photos[0]}
                  alt={ad.title}
                  className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                <div className="absolute top-2 right-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow" aria-hidden="true" />
                </div>

                <div className="absolute bottom-2 left-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-red-600 text-white shadow">
                    <MapPin className="w-3 h-3 fill-current" aria-hidden="true" />
                    <span>{ad.city}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Flèches : masquées sur mobile (le swipe suffit), visibles au pointeur (desktop) */}
          <button
            onClick={() => scrollByStep(-1)}
            aria-label="Défiler vers les annonces précédentes"
            className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 shadow-card text-slate-700 items-center justify-center hover:bg-white transition-all z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => scrollByStep(1)}
            aria-label="Défiler vers les annonces suivantes"
            className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 shadow-card text-slate-700 items-center justify-center hover:bg-white transition-all z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="pt-1 text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 min-h-11 px-6 rounded-xl bg-white border border-brand-blue-900 text-brand-blue-900 hover:bg-blue-50 text-xs font-extrabold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600 focus-visible:ring-offset-2"
        >
          <Star className="w-3.5 h-3.5 fill-brand-blue-900" aria-hidden="true" />
          <span>Voir le mur étoilé</span>
        </Link>
      </div>
    </div>
  );
}

/** Placeholder de chargement pour le carrousel VIP, même gabarit pour éviter le CLS. */
export function FeaturedCarouselSkeleton() {
  return (
    <div className="w-full space-y-2 py-2" role="status" aria-label="Chargement des annonces étoiles">
      <div className="skeleton h-5 w-48 rounded-md animate-pulse" />
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="skeleton flex-shrink-0 w-36 sm:w-40 h-56 sm:h-64 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
