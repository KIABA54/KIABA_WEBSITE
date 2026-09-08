import type { Ad, Gender } from "@/lib/types";

// Colonnes + relations nécessaires pour reconstruire la forme `Ad` du
// frontend à partir d'une ligne `ads` Supabase. Partagé entre
// GET /api/ads et GET /api/ads/[id] pour garder un seul mapping à jour.
export const AD_SELECT_WITH_RELATIONS =
  "*, user:users(username, profile_photo_url, gender), ad_photos(photo_url, display_order)";

interface AdPhotoRow {
  photo_url: string;
  display_order: number | null;
}

interface AdUserRow {
  username: string;
  profile_photo_url: string;
  gender: Gender;
}

// Ligne brute retournée par Supabase pour la requête ci-dessus.
export interface AdRow {
  id: string;
  user_id: string;
  user?: AdUserRow | AdUserRow[] | null;
  title: string;
  description: string;
  city: string;
  address: string;
  phone_number: string;
  contact_channels: Ad["contact_channels"];
  accepted_clients: Ad["accepted_clients"];
  category: string;
  subcategories: string[];
  formula: Ad["formula"];
  status: Ad["status"];
  is_boosted: boolean;
  boosted_at: string | null;
  expires_at: string;
  highlight_expires_at: string | null;
  ad_photos?: AdPhotoRow[] | null;
  created_at: string;
  updated_at: string;
}

export function mapAdRow(row: AdRow): Ad {
  const userRelation = Array.isArray(row.user) ? row.user[0] : row.user;

  return {
    id: row.id,
    user_id: row.user_id,
    user: userRelation
      ? {
          username: userRelation.username,
          profile_photo_url: userRelation.profile_photo_url,
          gender: userRelation.gender,
        }
      : undefined,
    title: row.title,
    description: row.description,
    city: row.city,
    address: row.address,
    phone_number: row.phone_number,
    contact_channels: row.contact_channels,
    accepted_clients: row.accepted_clients,
    category: row.category,
    subcategories: row.subcategories,
    formula: row.formula,
    status: row.status,
    is_boosted: row.is_boosted,
    boosted_at: row.boosted_at,
    expires_at: row.expires_at,
    highlight_expires_at: row.highlight_expires_at,
    photos: (row.ad_photos || [])
      .slice()
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((p) => p.photo_url),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
