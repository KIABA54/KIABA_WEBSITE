import { NextResponse } from "next/server";
import { verifyGeniusPayWebhook } from "@/lib/geniuspay";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const rawPayload = await req.text();

    const webhookSecret = process.env.GENIUSPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Webhook GeniusPay] GENIUSPAY_WEBHOOK_SECRET absent : impossible de vérifier la signature.");
      return NextResponse.json(
        { error: "Webhook non configuré : GENIUSPAY_WEBHOOK_SECRET manquant." },
        { status: 500 }
      );
    }

    // La signature est TOUJOURS vérifiée, quel que soit l'environnement :
    // un webhook non authentifié permettrait à n'importe qui d'activer une
    // annonce ou un boost sans payer.
    const verification = verifyGeniusPayWebhook(rawPayload, signature, timestamp, webhookSecret);
    if (!verification.isValid) {
      console.warn("[Webhook GeniusPay] Signature invalide:", verification.reason);
      return NextResponse.json(
        { error: "Signature invalide", reason: verification.reason },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawPayload);
    const event = payload.event;
    const data = payload.data;

    console.log(`[Webhook GeniusPay] Événement reçu: ${event}, Ref: ${data?.reference}`);

    if (event === "payment.success" || data?.status === "completed") {
      const reference = data.reference;
      const metadata = data.metadata || {};
      const actionType = metadata.action_type || "NEW_AD";
      const adId = metadata.ad_id;

      const supabase = createAdminClient();

      const { data: transaction } = await supabase
        .from("transactions")
        .select("id, status")
        .eq("geniuspay_reference", reference)
        .maybeSingle();

      if (!transaction) {
        console.warn(`[Webhook GeniusPay] Aucune transaction trouvée pour la référence ${reference}.`);
        return NextResponse.json({ received: true, warning: "transaction inconnue" });
      }

      // Idempotence : un webhook peut être renvoyé plusieurs fois par
      // l'agrégateur (retry). On ne réactive jamais une transaction déjà
      // complétée pour éviter les doubles activations/boosts.
      if (transaction.status === "COMPLETED") {
        return NextResponse.json({ received: true, idempotent: true });
      }

      await supabase
        .from("transactions")
        .update({
          status: "COMPLETED",
          completed_at: new Date().toISOString(),
          payment_method: data.payment_method || "mobile_money",
        })
        .eq("id", transaction.id);

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
      // EDIT : la transaction est marquée COMPLETED, aucune mise à jour de
      // contenu n'est déclenchée ici — la mise à jour des champs de
      // l'annonce éditée est hors périmètre de ce webhook de paiement.

      console.log(`[GeniusPay] Action ${actionType} activée avec succès pour annonce ${adId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("[Webhook GeniusPay] Erreur:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
