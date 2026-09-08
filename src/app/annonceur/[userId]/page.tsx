"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdCard, { AdCardSkeleton, AdListState } from "@/components/AdCard";
import type { Ad } from "@/lib/types";

export default function PublicAdvertiserPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);

  const [ads, setAds] = useState<Ad[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = () => {
    setIsLoading(true);
    setHasError(false);
    fetch(`/api/ads?user_id=${resolvedParams.userId}&limit=50`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur de chargement.");
        setAds(data.ads);
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.userId]);

  const advertiser = ads && ads.length > 0 ? ads[0].user : undefined;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux annonces</span>
      </Link>

      {!isLoading && advertiser && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3">
          <img
            src={advertiser.profile_photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
            alt=""
            className="w-14 h-14 rounded-full object-cover border-2 border-brand-pink-500 flex-shrink-0"
          />
          <div>
            <h1 className="text-base font-extrabold text-slate-900">{advertiser.username}</h1>
            <p className="text-xs text-slate-500">
              {ads?.length} annonce{(ads?.length ?? 0) > 1 ? "s" : ""} en ligne
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => <AdCardSkeleton key={i} />)}

        {!isLoading && hasError && (
          <AdListState
            variant="error"
            message="Impossible de charger les annonces de cet utilisateur."
            onRetry={load}
          />
        )}

        {!isLoading && !hasError && ads && ads.length === 0 && (
          <AdListState
            variant="empty"
            title="Aucune annonce en ligne"
            message="Cet utilisateur n'a aucune annonce active pour le moment."
          />
        )}

        {!isLoading &&
          !hasError &&
          ads?.map((ad) => <AdCard key={ad.id} ad={ad} />)}
      </div>
    </div>
  );
}
