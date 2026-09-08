import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { validateAdContent } from "@/lib/moderation";
import { initiateGeniusPayCheckout } from "@/lib/geniuspay";
import { FORMULAS } from "@/lib/constants";
import { AD_SELECT_WITH_RELATIONS, mapAdRow, type AdRow } from "@/lib/supabase/ads";
import { sendReceiptEmail } from "@/lib/email";
import type { AcceptedClient, ContactChannel, FormulaId } from "@/lib/types";

const CONTACT_CHANNELS: ContactChannel[] = ["WHATSAPP", "CALL", "BOTH"];
const ACCEPTED_CLIENTS: AcceptedClient[] = ["HOMME", "FEMME", "TRANSGENRE", "TOUS"];
const MAX_PHOTOS = 5;

interface CreateAdBody {
  title?: string;
  description?: string;
  city?: string;
  address?: string;
  phone_number?: string;
  contact_channels?: string;
  accepted_clients?: string;
  category?: string;
  subcategories?: string[];
  formula?: string;
  photos?: string[];
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Vous devez être connecté pour publier une annonce." }, { status: 401 });
    }

    const body: CreateAdBody = await req.json();
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
      formula,
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
      !category ||
      !formula
    ) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }

    if (!CONTACT_CHANNELS.includes(contact_channels as ContactChannel)) {
      return NextResponse.json({ error: "Canal de contact invalide." }, { status: 400 });
    }

    if (!ACCEPTED_CLIENTS.includes(accepted_clients as AcceptedClient)) {
      return NextResponse.json({ error: "Type de clientèle acceptée invalide." }, { status: 400 });
    }

    const formulaConfig = FORMULAS[formula as FormulaId];
    if (!formulaConfig) {
      return NextResponse.json({ error: "Formule invalide." }, { status: 400 });
    }

    if (!Array.isArray(photos) || photos.length < 1 || photos.length > MAX_PHOTOS) {
      return NextResponse.json(
        { error: `Vous devez fournir entre 1 et ${MAX_PHOTOS} photos.` },
        { status: 400 }
      );
    }

    // Modération serveur : jamais uniquement côté client, on ne fait
    // confiance à aucune validation faite dans le navigateur.
    const moderation = validateAdContent(title, description);
    if (!moderation.isValid) {
      return NextResponse.json({ error: moderation.reason }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, free_ad_eligible")
      .eq("id", session.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    // Prix recalculé côté serveur exclusivement : jamais depuis le body client.
    const price = formulaConfig.price;

    // Mode lancement : toutes les annonces sont gratuites tant que le site
    // vient d'ouvrir, quelle que soit la formule — le système de paiement
    // GeniusPay reste intact et se réactive simplement en repassant cette
    // variable à "false", sans rien supprimer ni modifier côté paiement.
    const launchModeFree = process.env.LAUNCH_MODE_FREE_ADS === "true";
    // Le crédit "1ère annonce gratuite" personnel de l'utilisateur n'est
    // consommé que hors mode lancement, pour qu'il le garde intact une fois
    // le mode lancement désactivé.
    const isFreeEligible = !launchModeFree && user.free_ad_eligible === true && formulaConfig.id === "STANDARD";
    const isFree = launchModeFree || isFreeEligible;

    const now = Date.now();
    const expiresAt = new Date(now + formulaConfig.durationDays * 24 * 60 * 60 * 1000).toISOString();
    const highlightExpiresAt =
      formulaConfig.highlightDays > 0
        ? new Date(now + formulaConfig.highlightDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const { data: createdAd, error: adInsertError } = await supabase
      .from("ads")
      .insert({
        user_id: session.userId,
        title,
        description,
        city,
        address,
        phone_number,
        contact_channels,
        accepted_clients,
        category,
        subcategories: Array.isArray(subcategories) ? subcategories : [],
        formula: formulaConfig.id,
        status: isFree ? "ONLINE" : "PENDING_PAYMENT",
        expires_at: expiresAt,
        highlight_expires_at: highlightExpiresAt,
      })
      .select("id")
      .single();

    if (adInsertError || !createdAd) {
      return NextResponse.json({ error: "Erreur lors de la création de l'annonce." }, { status: 500 });
    }

    const adId = createdAd.id as string;

    const photoRows = photos.map((url, index) => ({
      ad_id: adId,
      photo_url: url,
      display_order: index + 1,
    }));
    const { error: photosError } = await supabase.from("ad_photos").insert(photoRows);
    if (photosError) {
      await supabase.from("ads").delete().eq("id", adId);
      return NextResponse.json({ error: "Erreur lors de l'enregistrement des photos." }, { status: 500 });
    }

    if (isFree) {
      await supabase.from("transactions").insert({
        user_id: session.userId,
        ad_id: adId,
        type: "NEW_AD",
        amount_fcfa: 0,
        status: "COMPLETED",
        customer_phone: phone_number,
        completed_at: new Date().toISOString(),
        metadata: { free_first_ad: isFreeEligible, launch_promo: launchModeFree },
      });
      if (isFreeEligible) {
        await supabase.from("users").update({ free_ad_eligible: false }).eq("id", session.userId);
      }

      await sendReceiptEmail({
        email: session.email,
        type: "NEW_AD",
        reference: `FREE-${adId.slice(0, 8).toUpperCase()}`,
        amountFcfa: 0,
        adTitle: title,
        adId,
      });

      return NextResponse.json({
        success: true,
        ad_id: adId,
        status: "ONLINE",
        free: true,
      });
    }

    // Annonce payante : transaction PENDING + initiation GeniusPay.
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: session.userId,
        ad_id: adId,
        type: "NEW_AD",
        amount_fcfa: price,
        status: "PENDING",
        customer_phone: phone_number,
      })
      .select("id")
      .single();

    if (transactionError || !transaction) {
      await supabase.from("ads").delete().eq("id", adId);
      return NextResponse.json({ error: "Erreur lors de la création de la transaction." }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkout = await initiateGeniusPayCheckout({
      amount: price,
      currency: "XOF",
      description: `Publication annonce ${formulaConfig.name} - KIABA RENCONTRE`,
      customer: { phone: phone_number },
      success_url: `${appUrl}/paiement/succes`,
      error_url: `${appUrl}/paiement/echec`,
      metadata: { action_type: "NEW_AD", ad_id: adId },
    });

    if (!checkout.success || !checkout.data) {
      // Rollback : on ne laisse pas traîner une annonce/transaction orphelines.
      await supabase.from("transactions").delete().eq("id", transaction.id);
      await supabase.from("ads").delete().eq("id", adId);
      return NextResponse.json(
        { error: checkout.error?.message || "Erreur lors de l'initiation du paiement." },
        { status: 502 }
      );
    }

    await supabase
      .from("transactions")
      .update({ geniuspay_reference: checkout.data.reference })
      .eq("id", transaction.id);

    return NextResponse.json({
      success: true,
      ad_id: adId,
      status: "PENDING_PAYMENT",
      checkout_url: checkout.data.checkout_url,
      reference: checkout.data.reference,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const category = searchParams.get("category");
    const q = searchParams.get("q")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = createAdminClient();
    let query = supabase
      .from("ads")
      .select(AD_SELECT_WITH_RELATIONS, { count: "exact" })
      .eq("status", "ONLINE")
      .order("is_boosted", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (city) query = query.eq("city", city);
    if (category) query = query.eq("category", category);
    if (q) {
      // Échappe les caractères réservés de la syntaxe .or() de Supabase
      // (virgule/parenthèses) pour ne pas casser le filtre avec une entrée
      // utilisateur libre.
      const safe = q.replace(/[,()%]/g, " ").trim();
      if (safe) {
        query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%,city.ilike.%${safe}%`);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: "Erreur lors de la récupération des annonces." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ads: (data as unknown as AdRow[] | null)?.map(mapAdRow) || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
