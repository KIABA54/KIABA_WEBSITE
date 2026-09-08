import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAdExpiringEmail } from "@/lib/email";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

interface AlertWindow {
  hours: number;
  flagColumn: "alert_2d_sent" | "alert_1d_sent" | "alert_1h_sent";
  delayLabel: string;
}

const ALERT_WINDOWS: AlertWindow[] = [
  { hours: 48, flagColumn: "alert_2d_sent", delayLabel: "48 heures" },
  { hours: 24, flagColumn: "alert_1d_sent", delayLabel: "24 heures" },
  { hours: 1, flagColumn: "alert_1h_sent", delayLabel: "1 heure" },
];

// Envoie les alertes d'une fenêtre donnée (J-2 / J-1 / H-1) et marque
// chaque annonce traitée comme telle — sinon le prochain passage du cron
// (quelques minutes plus tard) renverrait le même email en boucle jusqu'à
// l'expiration réelle de l'annonce.
async function sendAlertsForWindow(supabase: SupabaseAdmin, now: Date, window: AlertWindow): Promise<number> {
  const threshold = new Date(now.getTime() + window.hours * 3600 * 1000).toISOString();

  const { data: ads } = await supabase
    .from("ads")
    .select("id, title, user_id, user:users(email)")
    .eq("status", "ONLINE")
    .eq(window.flagColumn, false)
    .lte("expires_at", threshold);

  if (!ads || ads.length === 0) return 0;

  const results = await Promise.allSettled(
    ads.map(async (ad) => {
      const user = Array.isArray(ad.user) ? ad.user[0] : ad.user;
      if (!user?.email) throw new Error(`Annonce ${ad.id} sans email utilisateur associé.`);
      await sendAdExpiringEmail(user.email, ad.title, ad.id, window.delayLabel);
      return ad.id as string;
    })
  );

  const sentAdIds = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value);

  if (sentAdIds.length > 0) {
    await supabase.from("ads").update({ [window.flagColumn]: true }).in("id", sentAdIds);
  }

  const failedCount = results.length - sentAdIds.length;
  if (failedCount > 0) {
    console.warn(`[Cron Expirations] ${failedCount} email(s) d'alerte (${window.delayLabel}) ont échoué, réessayés au prochain passage.`);
  }

  return sentAdIds.length;
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();

    // 1. DÉSACTIVATION AUTOMATIQUE DES ANNONCES EXPIRÉES (avant les alertes,
    // pour qu'une annonce déjà expirée ne reçoive plus d'alerte "va expirer").
    const { data: expiredAds } = await supabase
      .from("ads")
      .update({ status: "OFFLINE", updated_at: now.toISOString() })
      .eq("status", "ONLINE")
      .lte("expires_at", now.toISOString())
      .select("id, title, user_id");

    console.log(`[Cron Expirations] ${expiredAds?.length || 0} annonces passées HORS LIGNE.`);

    // 2. ALERTES D'EXPIRATION (J-2, J-1, H-1) — envoyées une seule fois par
    // fenêtre grâce aux colonnes alert_2d_sent/alert_1d_sent/alert_1h_sent.
    const alertCounts: Record<string, number> = {};
    for (const window of ALERT_WINDOWS) {
      alertCounts[window.flagColumn] = await sendAlertsForWindow(supabase, now, window);
    }

    return NextResponse.json({
      success: true,
      expired_count: expiredAds?.length || 0,
      alerts_sent: alertCounts,
      timestamp: now.toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
