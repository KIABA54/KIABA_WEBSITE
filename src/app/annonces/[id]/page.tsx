"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Gem,
  Phone,
  MessageCircle,
  Share2,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { Ad } from "@/lib/types";
import AdCard, { AdCardSkeleton } from "@/components/AdCard";
import { getCityLabel } from "@/lib/constants";

export default function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  const [ad, setAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [similarAds, setSimilarAds] = useState<Ad[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setNotFoundError(false);
    fetch(`/api/ads/${resolvedParams.id}`)
      .then(async (res) => {
        if (res.status === 404) {
          if (!cancelled) setNotFoundError(true);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur de chargement.");
        if (!cancelled) setAd(data.ad);
      })
      .catch(() => {
        if (!cancelled) setNotFoundError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedParams.id]);

  useEffect(() => {
    if (!ad) return;
    let cancelled = false;
    setSimilarAds(null);
    fetch(`/api/ads?category=${encodeURIComponent(ad.category)}&exclude_id=${ad.id}&limit=4`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur de chargement.");
        if (!cancelled) setSimilarAds(data.ads);
      })
      .catch(() => {
        if (!cancelled) setSimilarAds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ad?.id, ad?.category]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 flex flex-col items-center gap-2 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs">Chargement de l&apos;annonce...</p>
      </div>
    );
  }

  if (notFoundError || !ad) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-sm font-bold text-slate-800">Cette annonce n&apos;existe plus ou n&apos;est plus en ligne.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-pink-500 hover:bg-brand-pink-600 text-white font-bold text-xs shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux annonces</span>
        </Link>
      </div>
    );
  }

  const cleanPhone = ad.phone_number.replace(/\s+/g, "");

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: ad.title,
        text: `Découvrez cette annonce sur KIABA RENCONTRE : ${ad.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      {/* RETOUR & PARTAGE */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux annonces</span>
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copied ? "Lien copié !" : "Partager"}</span>
        </button>
      </div>

      {/* GALERIE PHOTOS (1 à 5 photos) */}
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800">
        <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full">
          <img
            src={ad.photos[activePhotoIdx]}
            alt={ad.title}
            className="w-full h-full object-contain sm:object-cover"
          />

          {/* BADGE FORMULE OFFICIEL */}
          <div className="absolute top-3 left-3">
            {ad.formula === "VIP" && (
              <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-pink-500 to-rose-600 text-white shadow-lg flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>ANNONCE VIP</span>
              </span>
            )}
            {ad.formula === "PRO_PLUS" && (
              <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-gradient-to-r from-pink-500 to-brand-blue-800 text-white shadow-lg">
                ANNONCE PRO (+)
              </span>
            )}
            {ad.formula === "PRO" && (
              <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-brand-blue-800 text-white shadow-lg">
                ANNONCE PRO
              </span>
            )}
            {ad.is_boosted && (
              <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-lg ml-1">
                BOOSTÉE ⚡
              </span>
            )}
          </div>

          {/* NAVIGATION FLECHES SI MULTIPLES PHOTOS */}
          {ad.photos.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActivePhotoIdx((prev) => (prev === 0 ? ad.photos.length - 1 : prev - 1))
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setActivePhotoIdx((prev) => (prev === ad.photos.length - 1 ? 0 : prev + 1))
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Indicateur 1/X */}
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-[11px] font-bold text-white">
                {activePhotoIdx + 1} / {ad.photos.length}
              </div>
            </>
          )}
        </div>

        {/* THUMBNAILS SI PLUSIEURS PHOTOS */}
        {ad.photos.length > 1 && (
          <div className="p-2 bg-slate-950 flex gap-2 overflow-x-auto justify-center">
            {ad.photos.map((url, idx) => (
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

      {/* TITRE & AUTEUR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
            {ad.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            {/* Utilisateur avec photo obligatoire — lien vers ses autres annonces */}
            <Link
              href={`/annonceur/${ad.user_id}`}
              className="flex items-center gap-1.5 font-bold text-slate-800 hover:text-brand-pink-600 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500"
            >
              <img
                src={ad.user?.profile_photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                alt=""
                className="w-6 h-6 rounded-full object-cover border border-brand-pink-500"
              />
              <span className="underline decoration-dotted underline-offset-2">{ad.user?.username || "Annonceur"}</span>
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {ad.user?.gender}
              </span>
            </Link>

            <span>•</span>

            {/* Ville & Adresse */}
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-semibold text-slate-900">{getCityLabel(ad.city)}</span>
              {ad.address && <span className="text-slate-500">({ad.address})</span>}
            </div>

            <span>•</span>

            {/* Catégorie */}
            <div className="flex items-center gap-1">
              <Gem className="w-3.5 h-3.5 text-brand-pink-500" />
              <span className="capitalize font-semibold text-slate-900">{ad.category.replace("-", " ")}</span>
            </div>
          </div>
        </div>

        {/* SOUS-CATÉGORIES BADGES */}
        {ad.subcategories?.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Prestations & Sous-catégories
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ad.subcategories.map((sub) => (
                <span
                  key={sub}
                  className="px-2.5 py-1 rounded-lg bg-brand-pink-50 border border-brand-pink-200 text-brand-pink-700 text-xs font-semibold"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CLIENTÈLE ACCEPTÉE */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Clientèle acceptée :</span>
          <span className="px-2.5 py-0.5 rounded-md bg-brand-blue-50 text-brand-blue-900 text-xs font-bold border border-brand-blue-200">
            {ad.accepted_clients === "TOUS" ? "Tout type de sexe" : ad.accepted_clients}
          </span>
        </div>

        {/* BOUTONS D'ACTION DIRECTE (CONTACT) */}
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(ad.contact_channels === "WHATSAPP" || ad.contact_channels === "BOTH") && (
            <a
              href={`https://wa.me/${cleanPhone}?text=Bonjour%20vu%20sur%20KIABA%20RENCONTRE%20:%20${encodeURIComponent(ad.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Contacter sur WhatsApp</span>
            </a>
          )}

          {(ad.contact_channels === "CALL" || ad.contact_channels === "BOTH") && (
            <a
              href={`tel:${cleanPhone}`}
              className="py-3 px-4 rounded-xl bg-brand-blue-800 hover:bg-brand-blue-900 text-white font-bold text-sm shadow-md shadow-brand-blue-800/20 flex items-center justify-center gap-2 transition-transform active:scale-98"
            >
              <Phone className="w-5 h-5 fill-current" />
              <span>Appeler ({ad.phone_number})</span>
            </a>
          )}
        </div>
      </div>

      {/* DESCRIPTION DÉTAILLÉE */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
          Description du service
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {ad.description}
        </p>
      </div>

      {/* SÉCURITÉ & RÈGLES */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-brand-pink-500 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 block mb-1">Rappel de sécurité pour les rencontres :</strong>
          N'envoyez jamais d'argent à l'avance pour un transport ou une caution imaginaire. Privilégiez toujours la prudence, l'hygiène et le respect mutuel.
        </div>
      </div>

      {/* ANNONCES SIMILAIRES */}
      {(similarAds === null || similarAds.length > 0) && (
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
            Annonces similaires
          </h2>
          <div className="flex flex-col items-center gap-3">
            {similarAds === null
              ? Array.from({ length: 2 }).map((_, i) => <AdCardSkeleton key={i} />)
              : similarAds.map((similarAd) => <AdCard key={similarAd.id} ad={similarAd} />)}
          </div>
        </div>
      )}
    </div>
  );
}
