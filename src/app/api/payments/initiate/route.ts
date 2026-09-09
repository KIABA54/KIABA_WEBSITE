import { NextResponse } from "next/server";
import { initiateGeniusPayCheckout } from "@/lib/geniuspay";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { checkRateLimit, rateLimitResponseBody } from "@/lib/rateLimit";
import { FORMULAS, BOOST_PERCENTAGE, computeRenewalUpdate } from "@/lib/constants";
import { sendReceiptEmail } from "@/lib/email";
import { runInBackground } from "@/lib/backgroundTask";
import type { FormulaId } from "@/lib/types";

// Cette route gère uniquement BOOST et RENEWAL sur une annonce EXISTANTE.
// - La création + premier paiement d'une nouvelle annonce passe par
//   POST /api/ads (gère aussi le cas de la 1ère annonce gratuite).
// - La modification de contenu passe par PATCH /api/ads/[id], qui gère le
//   paiement ET l'application des changements en un seul endroit (voir ce
//   fichier pour le détail — contrairement à BOOST/RENEWAL, EDIT porte des
//   données propres à chaque annonce qui doivent être stockées jusqu'à
//   confirmation du paiement).
type ExistingAdActionType = "BOOST" | "RENEWAL";
const ALLOWED_ACTIONS: ExistingAdActionType[] = ["BOOST", "RENEWAL"];

function computeAmount(actionType: ExistingAdActionType, formula: FormulaId): number {
  const formulaConfig = FORMULAS[formula];
  switch (actionType) {
    case "BOOST":
      return Math.round(BOOST_PERCENTAGE * formulaConfig.price);
    case "RENEWAL":
      return formulaConfig.price;
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
    }

    const rateLimit = await checkRateLimit(`payments:initiate:${session.userId}`, 20, 15 * 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(rateLimitResponseBody(), { status: 429 });
    }

    const body = await req.json();
    const { ad_id, action_type } = body as { ad_id?: string; action_type?: string };

    if (!ad_id || !action_type || !ALLOWED_ACTIONS.includes(action_type as ExistingAdActionType)) {
      return NextResponse.json(
        { error: "action_type doit être BOOST ou RENEWAL, avec un ad_id valide." },
        { status: 400 }
      );
    }
    const actionType = action_type as ExistingAdActionType;

    const supabase = createAdminClient();
    const { data: ad, error: adError } = await supabase
      .from("ads")
      .select("id, user_id, formula, status, phone_number, title")
      .eq("id", ad_id)
      .maybeSingle();

    if (adError || !ad) {
      return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
    }

    // L'annonce doit appartenir à l'utilisateur connecté.
    if (ad.user_id !== session.userId) {
      return NextResponse.json({ error: "Cette annonce ne vous appartient pas." }, { status: 403 });
    }

    if (actionType === "BOOST" && ad.status !== "ONLINE") {
      return NextResponse.json({ error: "Seule une annonce en ligne peut être boostée." }, { status: 409 });
    }
    if (actionType === "RENEWAL" && ad.status !== "OFFLINE") {
      return NextResponse.json({ error: "Seule une annonce hors ligne peut être renouvelée." }, { status: 409 });
    }

    // Montant recalculé côté serveur exclusivement, jamais depuis le body client.
    const amount = computeAmount(actionType, ad.formula as FormulaId);

    // Mode lancement : même dormance du paiement que pour les nouvelles
    // annonces (voir POST /api/ads) — l'action est appliquée immédiatement,
    // gratuitement, sans passer par GeniusPay.
    const launchModeFree = process.env.LAUNCH_MODE_FREE_ADS === "true";
    if (launchModeFree) {
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: session.userId,
          ad_id: ad.id,
          type: actionType,
          amount_fcfa: 0,
          status: "COMPLETED",
          customer_phone: ad.phone_number,
          completed_at: new Date().toISOString(),
          metadata: { launch_promo: true },
        })
        .select("id")
        .single();

      if (transactionError || !transaction) {
        return NextResponse.json({ error: "Erreur lors de la création de la transaction." }, { status: 500 });
      }

      if (actionType === "BOOST") {
        await supabase.from("ads").update({ is_boosted: true, boosted_at: new Date().toISOString() }).eq("id", ad.id);
      } else if (actionType === "RENEWAL") {
        const formulaConfig = FORMULAS[ad.formula as FormulaId];
        await supabase.from("ads").update(computeRenewalUpdate(formulaConfig)).eq("id", ad.id);
      }

      runInBackground(() =>
        sendReceiptEmail({
          email: session.email,
          type: actionType,
          reference: `FREE-${transaction.id.slice(0, 8).toUpperCase()}`,
          amountFcfa: 0,
          adTitle: ad.title,
          adId: ad.id,
        })
      );

      return NextResponse.json({ success: true, free: true });
    }

    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: session.userId,
        ad_id: ad.id,
        type: actionType,
        amount_fcfa: amount,
        status: "PENDING",
        customer_phone: ad.phone_number,
      })
      .select("id")
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json({ error: "Erreur lors de la création de la transaction." }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkout = await initiateGeniusPayCheckout({
      amount,
      currency: "XOF",
      description: `${actionType} annonce - KIABA RENCONTRE`,
      customer: { phone: ad.phone_number },
      success_url: `${appUrl}/paiement/succes`,
      error_url: `${appUrl}/paiement/echec`,
      metadata: { action_type: actionType, ad_id: ad.id },
    });

    if (!checkout.success || !checkout.data) {
      await supabase.from("transactions").delete().eq("id", transaction.id);
      return NextResponse.json(
        { success: false, error: checkout.error?.message || "Erreur GeniusPay" },
        { status: 502 }
      );
    }

    await supabase
      .from("transactions")
      .update({ geniuspay_reference: checkout.data.reference })
      .eq("id", transaction.id);

    return NextResponse.json({
      success: true,
      checkout_url: checkout.data.checkout_url,
      reference: checkout.data.reference,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
