import { NextResponse } from "next/server";
import { getAdsStats } from "@/lib/supabase/queries";

// Compteurs réels pour les pastilles de catégories/villes de l'accueil —
// jamais de nombre en dur côté client. Logique partagée avec le rendu
// serveur de la page d'accueil via getAdsStats().
export async function GET() {
  try {
    const stats = await getAdsStats();
    return NextResponse.json({ success: true, ...stats });
  } catch {
    return NextResponse.json({ error: "Erreur lors du calcul des statistiques." }, { status: 500 });
  }
}
