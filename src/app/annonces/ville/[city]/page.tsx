import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import AdCard, { AdListState } from "@/components/AdCard";
import { CITIES } from "@/lib/constants";
import { getOnlineAdsByCity } from "@/lib/supabase/queries";

interface PageProps {
  params: Promise<{ city: string }>;
}

function findCity(cityId: string) {
  return CITIES.find((c) => c.id === cityId);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const cityEntry = findCity(city);
  if (!cityEntry) return {};

  const title = `Annonces adultes à ${cityEntry.label}`;
  const description = `Petites annonces pour adultes à ${cityEntry.label} : escorte, massage et rencontres. Profils vérifiés, publication rapide et discrète sur KIABA RENCONTRE.`;

  return {
    title,
    description,
    alternates: { canonical: `/annonces/ville/${cityEntry.id}` },
    openGraph: { title: `${title} | KIABA RENCONTRE`, description },
    twitter: { title: `${title} | KIABA RENCONTRE`, description },
  };
}

// Chaque ville a sa propre URL indexable (au lieu d'un simple filtre côté
// client sur l'accueil) — c'est ce qui permet de cibler des recherches
// locales comme "annonces Abidjan" plutôt que de dépendre uniquement de la
// requête générique sur le nom du site.
export const revalidate = 300;

export default async function CityPage({ params }: PageProps) {
  const { city } = await params;
  const cityEntry = findCity(city);
  if (!cityEntry) notFound();

  const { ads, total } = await getOnlineAdsByCity(cityEntry.id, 24);

  const otherCities = CITIES.filter((c) => c.id !== cityEntry.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.ci-kiaba.com/" },
      { "@type": "ListItem", position: 2, name: cityEntry.label },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-pink-600 uppercase tracking-wider">
          <MapPin className="w-4 h-4" aria-hidden="true" />
          <span>{cityEntry.label}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          Annonces adultes à {cityEntry.label}
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Découvrez {total > 0 ? `${total} annonce${total > 1 ? "s" : ""}` : "les annonces"} pour
          adultes à {cityEntry.label} sur KIABA RENCONTRE&nbsp;: escorte, massage et rencontres.
          Chaque profil est vérifié par email avant publication, et les échanges se font
          directement avec l&apos;annonceur, en toute discrétion.
        </p>
      </div>

      {ads.length === 0 ? (
        <AdListState
          variant="empty"
          title={`Aucune annonce à ${cityEntry.label} pour le moment`}
          message="Revenez bientôt, ou consultez les annonces des autres villes ci-dessous."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 justify-items-center sm:justify-items-stretch">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}

      {/* MAILLAGE INTERNE : parcourir les autres villes */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Parcourir les annonces par ville
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {otherCities.map((c) => (
            <Link
              key={c.id}
              href={`/annonces/ville/${c.id}`}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-pink-50 hover:text-brand-pink-700 text-slate-600 text-xs font-semibold transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
