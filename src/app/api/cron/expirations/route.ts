import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();

    // 1. DÉSACTIVATION AUTOMATIQUE DES ANNONCES EXPIRÉES
    // Passe automatiquement de ONLINE à OFFLINE
    const { data: expiredAds } = await supabase
      .from("ads")
      .update({ status: "OFFLINE", updated_at: now.toISOString() })
      .eq("status", "ONLINE")
      .lte("expires_at", now.toISOString())
      .select("id, title, user_id");

    console.log(`[Cron Expirations] ${expiredAds?.length || 0} annonces passées HORS LIGNE.`);

    // 2. ENVOI DES ALERTES D'EXPIRATION (J-2, J-1, H-1)
    // Alertes 48h (J-2)
    const in48h = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
    const { data: ads48h } = await supabase
      .from("ads")
      .select("id, title, user_id")
      .eq("status", "ONLINE")
      .eq("alert_2d_sent", false)
      .lte("expires_at", in48h);

    if (ads48h && ads48h.length > 0) {
      console.log(`[Email Alerte J-2] ${ads48h.length} emails d'alerte 48h déclenchés.`);
    }

    return NextResponse.json({
      success: true,
      expired_count: expiredAds?.length || 0,
      timestamp: now.toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
