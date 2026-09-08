import { NextResponse } from "next/server";
import { verifyGeniusPayWebhook } from "@/lib/geniuspay";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const rawPayload = await req.text();

    const webhookSecret = process.env.GENIUSPAY_WEBHOOK_SECRET || "whsec_mock";

    // Vérification de sécurité de la signature cryptographique GeniusPay
    if (process.env.NODE_ENV === "production") {
      const verification = verifyGeniusPayWebhook(
        rawPayload,
        signature,
        timestamp,
        webhookSecret
      );

      if (!verification.isValid) {
        console.warn("[Webhook GeniusPay] Signature invalide:", verification.reason);
        return NextResponse.json(
          { error: "Signature invalide", reason: verification.reason },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawPayload);
    const event = payload.event;
    const data = payload.data;

    console.log(`[Webhook GeniusPay] Événement reçu: ${event}, Ref: ${data?.reference}`);

    // TRAITEMENT DU PAIEMENT RÉUSSI
    if (event === "payment.success" || data?.status === "completed") {
      const reference = data.reference;
      const metadata = data.metadata || {};
      const actionType = metadata.action_type || "NEW_AD";
      const adId = metadata.ad_id;

      const supabase = createAdminClient();

      // 1. Mettre à jour la transaction
      await supabase
        .from("transactions")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
          payment_method: data.payment_method || "mobile_money",
        })
        .eq("geniuspay_reference", reference);

      // 2. Activer l'annonce selon l'action
      if (actionType === "NEW_AD" && adId) {
        await supabase
          .from("ads")
          .update({ status: "ONLINE", updated_at: new Date().toISOString() })
          .eq("id", adId);
      } else if (actionType === "BOOST" && adId) {
        await supabase
          .from("ads")
          .update({ is_boosted: true, boosted_at: new Date().toISOString() })
          .eq("id", adId);
      } else if (actionType === "RENEWAL" && adId) {
        await supabase
          .from("ads")
          .update({
            status: "ONLINE",
            expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
          })
          .eq("id", adId);
      }

      console.log(`[GeniusPay] Action ${actionType} activée avec succès pour annonce ${adId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Webhook GeniusPay] Erreur:", error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
