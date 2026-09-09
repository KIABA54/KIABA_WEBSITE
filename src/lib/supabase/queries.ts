import { cache } from "react";
import { createAdminClient } from "./admin";
import { AD_SELECT_WITH_RELATIONS, mapAdRow, type AdRow } from "./ads";
import type { Ad, User } from "@/lib/types";

// Requêtes serveur partagées entre generateMetadata() et le rendu de la page
// (React Server Components) — `cache()` déduplique l'appel Supabase pour
// qu'une même requête HTTP ne le déclenche qu'une seule fois même si les
// deux fonctions demandent la même annonce.

export const getAdById = cache(async (id: string): Promise<Ad | null> => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ads")
    .select(AD_SELECT_WITH_RELATIONS)
    .eq("id", id)
    .eq("status", "ONLINE")
    .maybeSingle();

  if (error || !data) return null;
  return mapAdRow(data as unknown as AdRow);
});

export const getSimilarAds = cache(
  async (category: string, excludeId: string, limit = 4): Promise<Ad[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("ads")
      .select(AD_SELECT_WITH_RELATIONS)
      .eq("status", "ONLINE")
      .eq("category", category)
      .neq("id", excludeId)
      .order("is_boosted", { ascending: false })
      .order("highlight_expires_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    return ((data as unknown as AdRow[] | null) || []).map(mapAdRow);
  }
);

export interface AdsStats {
  total: number;
  byCategory: Record<string, number>;
  topCities: { name: string; count: number }[];
}

export const getAdsStats = cache(async (): Promise<AdsStats> => {
  const supabase = createAdminClient();
  const { data } = await supabase.from("ads").select("category, city").eq("status", "ONLINE");

  const byCategory: Record<string, number> = {};
  const cityCounts = new Map<string, number>();
  for (const row of data || []) {
    const r = row as { category: string; city: string };
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    cityCounts.set(r.city, (cityCounts.get(r.city) || 0) + 1);
  }

  const topCities = Array.from(cityCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { total: data?.length || 0, byCategory, topCities };
});

export interface AdsPageResult {
  ads: Ad[];
  total: number;
}

/**
 * ids + dates de mise à jour de toutes les annonces en ligne, pour le
 * sitemap. Un seul fichier sitemap suffit tant qu'on reste sous la limite
 * de 50 000 URLs de Google — au-delà, il faudrait passer à un index de
 * sitemaps (plusieurs fichiers), pas la peine avant longtemps ici.
 */
export const getAllOnlineAdIdsForSitemap = cache(
  async (): Promise<{ id: string; title: string; updated_at: string }[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("ads")
      .select("id, title, updated_at")
      .eq("status", "ONLINE")
      .order("updated_at", { ascending: false })
      .limit(45000);

    return (data as { id: string; title: string; updated_at: string }[] | null) || [];
  }
);

/** Première page d'annonces en ligne — utilisée pour le rendu initial (SSR) de l'accueil. */
export const getOnlineAdsPage = cache(async (limit = 12): Promise<AdsPageResult> => {
  const supabase = createAdminClient();
  const { data, count } = await supabase
    .from("ads")
    .select(AD_SELECT_WITH_RELATIONS, { count: "exact" })
    .eq("status", "ONLINE")
    .order("is_boosted", { ascending: false })
    .order("highlight_expires_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(0, limit - 1);

  return {
    ads: ((data as unknown as AdRow[] | null) || []).map(mapAdRow),
    total: count || 0,
  };
});

/** Profil complet de l'utilisateur connecté — pour le rendu serveur de /profil. */
export async function getUserById(id: string): Promise<User | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, birth_date, gender, profile_photo_url, is_verified, free_ad_eligible, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as User;
}

/** Toutes les annonces (hors supprimées) de l'utilisateur connecté — pour /profil. */
export async function getUserAds(userId: string): Promise<Ad[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("ads")
    .select(AD_SELECT_WITH_RELATIONS)
    .eq("user_id", userId)
    .neq("status", "DELETED")
    .order("created_at", { ascending: false });

  return ((data as unknown as AdRow[] | null) || []).map(mapAdRow);
}

/** Annonces en ligne d'un annonceur donné — page publique /annonceur/[userId]. */
export const getPublicAdvertiserAds = cache(async (userId: string): Promise<Ad[]> => {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("ads")
    .select(AD_SELECT_WITH_RELATIONS)
    .eq("user_id", userId)
    .eq("status", "ONLINE")
    .order("is_boosted", { ascending: false })
    .order("highlight_expires_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);

  return ((data as unknown as AdRow[] | null) || []).map(mapAdRow);
});

/** Annonces en ligne d'une ville donnée — pages SEO dédiées /annonces/ville/[city]. */
export const getOnlineAdsByCity = cache(async (cityId: string, limit = 24): Promise<AdsPageResult> => {
  const supabase = createAdminClient();
  const { data, count } = await supabase
    .from("ads")
    .select(AD_SELECT_WITH_RELATIONS, { count: "exact" })
    .eq("status", "ONLINE")
    .eq("city", cityId)
    .order("is_boosted", { ascending: false })
    .order("highlight_expires_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(0, limit - 1);

  return {
    ads: ((data as unknown as AdRow[] | null) || []).map(mapAdRow),
    total: count || 0,
  };
});
