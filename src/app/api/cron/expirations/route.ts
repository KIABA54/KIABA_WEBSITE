import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAdExpiringEmail } from "@/lib/email";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

interface AlertWindow {
  hours: number;
  flagColumn: "alert_2d_sent" | "alert_1d_sent" | "alert_1h_sent";
  delayLabel: string;
}

// Le plan Vercel Hobby limite les Cron Jobs à une exécution par jour (voir
// vercel.json) : la fenêtre H-1 ("1 heure avant expiration") ne peut donc se
// déclencher que pour les annonces qui expirent dans l'heure suivant le
// passage quotidien du cron — la plupart des annonces n'auront jamais
// d'alerte H-1 en pratique. J-2/J-1 restent utiles (préviennent bien avant,
// juste avec ~24h de marge d'imprécision au lieu de pile 48h/24h). Pour un
// vrai H-1 fiable, il faudrait soit passer au plan Pro (cron plus fréquent),
// soit appeler cette route depuis un service externe (GitHub Actions,
// cron-job.org...) avec l'en-tête "Authorization: Bearer <CRON_SECRET>".
// Triées de la plus urgente à la moins urgente : voir pourquoi dans
// sendAlertsForWindow ci-dessous (bug réel trouvé lors d'un audit — une
// annonce qui expire dans 30 minutes recevait les 3 emails "48h", "24h" ET
// "1h" d'un coup, puisque `expires_at <= seuil` matche les 3 fenêtres à la
// fois pour une échéance aussi proche).
const ALERT_WINDOWS: AlertWindow[] = [
  { hours: 1, flagColumn: "alert_1h_sent", delayLabel: "1 heure" },
  { hours: 24, flagColumn: "alert_1d_sent", delayLabel: "24 heures" },
  { hours: 48, flagColumn: "alert_2d_sent", delayLabel: "48 heures" },
];

// Envoie les alertes d'une fenêtre donnée (H-1 / J-1 / J-2) et marque
// chaque annonce traitée comme telle — sinon le prochain passage du cron
// (quelques minutes plus tard) renverrait le même email en boucle jusqu'à
// l'expiration réelle de l'annonce.
//
// `supersededWindows` : les fenêtres MOINS urgentes (traitées après celle-ci
// dans ALERT_WINDOWS) sont marquées comme envoyées EN MÊME TEMPS que celle-
// ci — sans ça, une annonce qui expire dans 30 minutes matche à la fois les
// seuils "48h", "24h" ET "1h" (tous des `expires_at <= seuil`), et recevait
// les 3 emails d'un coup au lieu du seul email pertinent ("1h").
async function sendAlertsForWindow(
  supabase: SupabaseAdmin,
  now: Date,
  window: AlertWindow,
  supersededWindows: AlertWindow[]
): Promise<number> {
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
    const flagsToSet: Record<string, boolean> = { [window.flagColumn]: true };
    for (const superseded of supersededWindows) {
      flagsToSet[superseded.flagColumn] = true;
    }
    await supabase.from("ads").update(flagsToSet).in("id", sentAdIds);
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
    for (let i = 0; i < ALERT_WINDOWS.length; i++) {
      const window = ALERT_WINDOWS[i];
      const supersededWindows = ALERT_WINDOWS.slice(i + 1);
      alertCounts[window.flagColumn] = await sendAlertsForWindow(supabase, now, window, supersededWindows);
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
