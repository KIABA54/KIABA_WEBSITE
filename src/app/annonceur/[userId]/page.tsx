import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdCard, { AdListState } from "@/components/AdCard";
import { getPublicAdvertiserAds } from "@/lib/supabase/queries";

interface PageProps {
  params: Promise<{ userId: string }>;
}

// Page publique, indexable — rendue côté serveur comme les autres pages
// d'annonces (voir /annonces/ville/[city]) au lieu d'un fetch client au
// montage, pour la même raison : contenu disponible dès la première réponse
// (SEO + latence), pas de squelette de chargement pour une page publique.
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const ads = await getPublicAdvertiserAds(userId);
  const advertiser = ads[0]?.user;
  if (!advertiser) return {};

  const title = `Annonces de ${advertiser.username}`;
  const description = `${ads.length} annonce${ads.length > 1 ? "s" : ""} en ligne de ${advertiser.username} sur KIABA RENCONTRE.`;

  return {
    title,
    description,
    alternates: { canonical: `/annonceur/${userId}` },
    openGraph: { title: `${title} | KIABA RENCONTRE`, description },
    twitter: { title: `${title} | KIABA RENCONTRE`, description },
  };
}

export default async function PublicAdvertiserPage({ params }: PageProps) {
  const { userId } = await params;
  const ads = await getPublicAdvertiserAds(userId);
  const advertiser = ads[0]?.user;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour aux annonces</span>
      </Link>

      {advertiser && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- photo hébergée sur Supabase Storage, hors domaines optimisés par défaut */}
          <img
            src={advertiser.profile_photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
            alt={`Photo de profil de ${advertiser.username}`}
            loading="lazy"
            className="w-14 h-14 rounded-full object-cover border-2 border-brand-pink-500 flex-shrink-0"
          />
          <div>
            <h1 className="text-base font-extrabold text-slate-900">{advertiser.username}</h1>
            <p className="text-xs text-slate-500">
              {ads.length} annonce{ads.length > 1 ? "s" : ""} en ligne
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        {ads.length === 0 && (
          <AdListState
            variant="empty"
            title="Aucune annonce en ligne"
            message="Cet utilisateur n'a aucune annonce active pour le moment."
          />
        )}

        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </div>
  );
}
