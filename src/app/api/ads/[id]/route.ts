import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { AD_SELECT_WITH_RELATIONS, mapAdRow, type AdRow } from "@/lib/supabase/ads";
import { sendAdDeletedEmail, sendReceiptEmail } from "@/lib/email";
import { runInBackground } from "@/lib/backgroundTask";
import { validateAdContent } from "@/lib/moderation";
import { initiateGeniusPayCheckout } from "@/lib/geniuspay";
import { checkRateLimit, rateLimitResponseBody } from "@/lib/rateLimit";
import {
  EDIT_AD_PRICE,
  CONTACT_CHANNELS,
  CLIENT_TYPES,
  MIN_AD_TITLE_LENGTH,
  MIN_AD_DESCRIPTION_LENGTH,
  MAX_AD_PHOTOS as MAX_PHOTOS,
} from "@/lib/constants";

const CONTACT_CHANNEL_IDS: readonly string[] = CONTACT_CHANNELS.map((c) => c.id);
const ACCEPTED_CLIENT_IDS: readonly string[] = CLIENT_TYPES.map((c) => c.id);

interface EditAdBody {
  title?: string;
  description?: string;
  city?: string;
  address?: string;
  phone_number?: string;
  contact_channels?: string;
  accepted_clients?: string;
  category?: string;
  subcategories?: string[];
  photos?: string[];
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("ads")
      .select(AD_SELECT_WITH_RELATIONS)
      .eq("id", id)
      .eq("status", "ONLINE")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
    }

    return NextResponse.json({ success: true, ad: mapAdRow(data as unknown as AdRow) });
  } catch (error: unknown) {
    console.error("[API ads/:id] Erreur:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Modification du contenu d'une annonce déjà en ligne. Le prix (999 FCFA)
// et l'application des changements sont gérés ICI d'un bout à l'autre : les
// champs modifiés sont stockés dans transactions.metadata.pending_changes et
// appliqués soit immédiatement (mode lancement gratuit), soit par le webhook
// GeniusPay une fois le paiement confirmé (voir /api/webhooks/geniuspay).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
    }

    const { id } = await params;
    const body: EditAdBody = await req.json();
    const {
      title,
      description,
      city,
      address,
      phone_number,
      contact_channels,
      accepted_clients,
      category,
      subcategories,
      photos,
    } = body;

    if (
      !title ||
      !description ||
      !city ||
      !address ||
      !phone_number ||
      !contact_channels ||
      !accepted_clients ||
      !category
    ) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }
    if (title.trim().length < MIN_AD_TITLE_LENGTH) {
      return NextResponse.json(
        { error: `Le titre doit comporter au moins ${MIN_AD_TITLE_LENGTH} caractères.` },
        { status: 400 }
      );
    }
    if (description.trim().length < MIN_AD_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `La description doit comporter au moins ${MIN_AD_DESCRIPTION_LENGTH} caractères.` },
        { status: 400 }
      );
    }
    if (!CONTACT_CHANNEL_IDS.includes(contact_channels)) {
      return NextResponse.json({ error: "Canal de contact invalide." }, { status: 400 });
    }
    if (!ACCEPTED_CLIENT_IDS.includes(accepted_clients)) {
      return NextResponse.json({ error: "Type de clientèle acceptée invalide." }, { status: 400 });
    }
    if (!Array.isArray(photos) || photos.length < 1 || photos.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Vous devez fournir entre 1 et ${MAX_PHOTOS} photos.` },
        { status: 400 }
      );
    }

    const moderation = validateAdContent(title, description);
    if (!moderation.isValid) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 });
    }

    // Ni l'une ni l'autre ne dépend du résultat de l'autre — parallélisées
    // pour économiser un aller-retour réseau à chaque modification.
    const supabase = createAdminClient();
    const [rateLimit, { data: ad }] = await Promise.all([
      checkRateLimit(`ads:edit:${session.userId}`, 20, 15 * 60),
      supabase.from("ads").select("id, user_id, status").eq("id", id).maybeSingle(),
    ]);
    if (!rateLimit.allowed) {
      return NextResponse.json(rateLimitResponseBody(), { status: 429 });
    }

    if (!ad) {
      return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
    }
    if (ad.user_id !== session.userId) {
      return NextResponse.json({ error: "Cette annonce ne vous appartient pas." }, { status: 403 });
    }
    if (ad.status !== "ONLINE") {
      return NextResponse.json({ error: "Seule une annonce en ligne peut être modifiée." }, { status: 409 });
    }

    const pendingChanges = {
      title,
      description,
      city,
      address,
      phone_number,
      contact_channels,
      accepted_clients,
      category,
      subcategories: Array.isArray(subcategories) ? subcategories : [],
      photos,
    };

    const launchModeFree = process.env.LAUNCH_MODE_FREE_ADS === "true";

    if (launchModeFree) {
      const { error: updateError } = await supabase
        .from("ads")
        .update({
          title,
          description,
          city,
          address,
          phone_number,
          contact_channels,
          accepted_clients,
          category,
          subcategories: pendingChanges.subcategories,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json({ error: "Erreur lors de la modification de l'annonce." }, { status: 500 });
      }

      await supabase.from("ad_photos").delete().eq("ad_id", id);
      await supabase.from("ad_photos").insert(
        photos.map((url, index) => ({ ad_id: id, photo_url: url, display_order: index + 1 }))
      );

      await supabase.from("transactions").insert({
        user_id: session.userId,
        ad_id: id,
        type: "EDIT",
        amount_fcfa: 0,
        status: "COMPLETED",
        customer_phone: phone_number,
        completed_at: new Date().toISOString(),
        metadata: { launch_promo: true },
      });

      runInBackground(() =>
        sendReceiptEmail({
          email: session.email,
          type: "EDIT",
          reference: `FREE-EDIT-${id.slice(0, 8).toUpperCase()}`,
          amountFcfa: 0,
          adTitle: title,
          adId: id,
        })
      );

      return NextResponse.json({ success: true, free: true });
    }

    // Paiement réel : les changements attendent dans la transaction PENDING,
    // appliqués par le webhook GeniusPay seulement une fois le paiement confirmé.
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: session.userId,
        ad_id: id,
        type: "EDIT",
        amount_fcfa: EDIT_AD_PRICE,
        status: "PENDING",
        customer_phone: phone_number,
        metadata: { pending_changes: pendingChanges },
      })
      .select("id")
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json({ error: "Erreur lors de la création de la transaction." }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkout = await initiateGeniusPayCheckout({
      amount: EDIT_AD_PRICE,
      currency: "XOF",
      description: "Modification annonce - KIABA RENCONTRE",
      customer: { phone: phone_number },
      success_url: `${appUrl}/paiement/succes`,
      error_url: `${appUrl}/paiement/echec`,
      metadata: { action_type: "EDIT", ad_id: id },
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
    console.error("[API ads/:id] Erreur:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Suppression volontaire par le propriétaire — irréversible, mais un
// changement de statut (pas une suppression de ligne) pour garder l'intégrité
// des transactions déjà associées à cette annonce.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Vous devez être connecté." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: ad } = await supabase.from("ads").select("id, user_id, status, title").eq("id", id).maybeSingle();
    if (!ad) {
      return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
    }
    if (ad.user_id !== session.userId) {
      return NextResponse.json({ error: "Cette annonce ne vous appartient pas." }, { status: 403 });
    }
    if (ad.status === "DELETED") {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase
      .from("ads")
      .update({ status: "DELETED", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Erreur lors de la suppression de l'annonce." }, { status: 500 });
    }

    runInBackground(() => sendAdDeletedEmail(session.email, ad.title));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[API ads/:id] Erreur:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
