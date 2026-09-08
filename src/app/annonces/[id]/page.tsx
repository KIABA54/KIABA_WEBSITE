import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Gem, Phone, MessageCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import AdCard from "@/components/AdCard";
import AdGallery from "@/components/AdGallery";
import ShareButton from "@/components/ShareButton";
import { getCityLabel } from "@/lib/constants";
import { getAdById, getSimilarAds } from "@/lib/supabase/queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const ad = await getAdById(id);

  if (!ad) {
    return { title: "Annonce introuvable" };
  }

  const cityLabel = getCityLabel(ad.city);
  // Le <title> passe par le template du layout racine (title.template),
  // qui ajoute déjà "| KIABA RENCONTRE" — ne pas le répéter ici. En
  // revanche openGraph.title/twitter.title ne sont PAS templatés par
  // Next.js : ces champs veulent une chaîne complète, donc ils le portent.
  const pageTitle = `${ad.title} — ${cityLabel}`;
  const socialTitle = `${pageTitle} | KIABA RENCONTRE`;
  const description = ad.description.slice(0, 155);

  return {
    title: pageTitle,
    description,
    alternates: { canonical: `/annonces/${ad.id}` },
    openGraph: {
      title: socialTitle,
      description,
      type: "article",
      images: ad.photos[0] ? [{ url: ad.photos[0] }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: ad.photos[0] ? [ad.photos[0]] : undefined,
    },
  };
}

export default async function AdDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ad = await getAdById(id);

  if (!ad) {
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

  const similarAds = await getSimilarAds(ad.category, ad.id, 4);
  const cityLabel = getCityLabel(ad.city);
  const cleanPhone = ad.phone_number.replace(/\s+/g, "");

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.ci-kiaba.com/" },
      {
        "@type": "ListItem",
        position: 2,
        name: cityLabel,
        item: `https://www.ci-kiaba.com/?city=${ad.city}`,
      },
      { "@type": "ListItem", position: 3, name: ad.title },
    ],
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* RETOUR & PARTAGE */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux annonces</span>
        </Link>

        <ShareButton title={ad.title} />
      </div>

      {/* GALERIE PHOTOS (1 à 5 photos) */}
      <AdGallery photos={ad.photos} title={ad.title} formula={ad.formula} isBoosted={ad.is_boosted} />

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
              <span className="font-semibold text-slate-900">{cityLabel}</span>
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
      {similarAds.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
            Annonces similaires
          </h2>
          <div className="flex flex-col items-center gap-3">
            {similarAds.map((similarAd) => (
              <AdCard key={similarAd.id} ad={similarAd} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
