import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Lecture publique volontairement minimale : sert uniquement à afficher un
// reçu de paiement fiable sur /paiement/succes ou /echec après redirection
// GeniusPay (qui ne renvoie que "reference"/"status", pas le montant réel).
// Aucune donnée sensible (user_id, téléphone, etc.) n'est exposée ici.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "Référence requise." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount_fcfa, status, payment_method, ad_id")
    .eq("geniuspay_reference", reference)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Transaction introuvable." }, { status: 404 });
  }

  return NextResponse.json({ success: true, transaction: data });
}
