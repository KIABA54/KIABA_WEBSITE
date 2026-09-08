import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Compteurs réels pour les pastilles de catégories/villes de l'accueil —
// jamais de nombre en dur côté client. Ne sélectionne que category/city
// (pas les colonnes lourdes) pour rester léger tant que le volume
// d'annonces reste modeste.
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ads")
    .select("category, city")
    .eq("status", "ONLINE");

  if (error) {
    return NextResponse.json({ error: "Erreur lors du calcul des statistiques." }, { status: 500 });
  }

  const byCategory: Record<string, number> = {};
  const cityCounts = new Map<string, number>();

  for (const row of data || []) {
    byCategory[row.category] = (byCategory[row.category] || 0) + 1;
    cityCounts.set(row.city, (cityCounts.get(row.city) || 0) + 1);
  }

  const topCities = Array.from(cityCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return NextResponse.json({
    success: true,
    total: data?.length || 0,
    byCategory,
    topCities,
  });
}
