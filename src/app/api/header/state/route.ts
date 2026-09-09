import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdsStats } from "@/lib/supabase/queries";

// Endpoint dédié au Header (visible sur chaque page, refait à chaque
// navigation) : fusionne ce qui nécessitait avant deux requêtes séparées
// ("/api/auth/me", qui va jusqu'à lire la table users pour un simple
// booléen, et "/api/ads/stats") en une seule. getSession() ne lit qu'un
// cookie signé (pas de DB), donc ce endpoint reste très léger.
export async function GET() {
  const [session, stats] = await Promise.all([getSession(), getAdsStats()]);
  return NextResponse.json({
    isAuthenticated: Boolean(session),
    adCount: stats.total,
  });
}
