import { createAdminClient } from "@/lib/supabase/admin";

// -------------------------------------------------------------------------
// Rate limiting "best effort" basé sur Postgres.
//
// Il n'y a pas de Redis provisionné pour ce projet. Cette implémentation
// utilise une fenêtre fixe (fixed window) stockée dans la table
// `rate_limits` (voir supabase/schema.sql) : lecture puis écriture, donc
// pas atomique. Sur des instances serverless "Fluid Compute", plusieurs
// requêtes concurrentes peuvent dans de rares cas dépasser légèrement la
// limite (race condition read-then-write). C'est acceptable comme frein
// anti-abus basique (brute force OTP, spam d'inscription, etc.) mais ce
// n'est PAS une protection anti-DDoS : pour ça il faudrait Upstash Redis
// (compteur atomique INCR) ou Vercel Firewall en amont.
// -------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Vérifie et incrémente le compteur pour `key` sur une fenêtre glissante
 * (arrondie à `windowSeconds`). Retourne `allowed: false` si la limite est
 * atteinte pour la fenêtre en cours.
 *
 * En cas d'erreur d'accès à la base (ex: table absente en dev local sans
 * migration), on choisit de LAISSER PASSER la requête plutôt que de casser
 * le site : le rate limiting est une protection best-effort, pas une
 * garantie de disponibilité.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const supabase = createAdminClient();
    const windowMs = windowSeconds * 1000;
    const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();

    const { data: existing, error: selectError } = await supabase
      .from("rate_limits")
      .select("count")
      .eq("key", key)
      .eq("window_start", windowStart)
      .maybeSingle();

    if (selectError) {
      console.warn("[RateLimit] Lecture impossible, requête autorisée par défaut:", selectError.message);
      return { allowed: true, remaining: limit };
    }

    if (!existing) {
      await supabase.from("rate_limits").insert({ key, window_start: windowStart, count: 1 });
      return { allowed: true, remaining: limit - 1 };
    }

    if (existing.count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    await supabase
      .from("rate_limits")
      .update({ count: existing.count + 1 })
      .eq("key", key)
      .eq("window_start", windowStart);

    return { allowed: true, remaining: limit - (existing.count + 1) };
  } catch (error) {
    console.warn("[RateLimit] Erreur inattendue, requête autorisée par défaut:", error);
    return { allowed: true, remaining: limit };
  }
}

/** Extrait la meilleure IP client disponible depuis les en-têtes de la requête. */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/** Réponse JSON 429 standard à retourner quand `checkRateLimit` refuse la requête. */
export function rateLimitResponseBody(message = "Trop de tentatives. Veuillez réessayer plus tard.") {
  return { error: message };
}
