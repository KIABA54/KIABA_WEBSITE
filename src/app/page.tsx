import type { Metadata } from "next";
import HomeAdsExplorer from "@/components/HomeAdsExplorer";
import { getOnlineAdsPage, getAdsStats } from "@/lib/supabase/queries";

const HOME_TITLE = "KIABA RENCONTRE — Petites annonces adultes en Côte d'Ivoire";
const HOME_DESCRIPTION =
  "Petites annonces pour adultes à Abidjan, Bouaké, Yamoussoukro et dans toute la Côte d'Ivoire. Escorte, massage et rencontres — publication rapide, discrète et sécurisée.";

export const metadata: Metadata = {
  // `absolute` court-circuite le template du layout racine (qui ajoute
  // "| KIABA RENCONTRE" aux autres pages) : sur l'accueil, la marque doit
  // ouvrir le titre plutôt que le refermer en double.
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: HOME_TITLE, description: HOME_DESCRIPTION },
  twitter: { title: HOME_TITLE, description: HOME_DESCRIPTION },
};

// Revalide périodiquement plutôt qu'à chaque requête : les annonces
// changent, mais pas seconde par seconde — un cache court garde l'accueil
// rapide (bon pour le SEO/Core Web Vitals) sans afficher des données
// périmées trop longtemps.
export const revalidate = 60;

export default async function HomePage() {
  const [{ ads, total }, stats] = await Promise.all([getOnlineAdsPage(12), getAdsStats()]);

  return <HomeAdsExplorer initialAds={ads} initialTotal={total} initialStats={stats} />;
}
