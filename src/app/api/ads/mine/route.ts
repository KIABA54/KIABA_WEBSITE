import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { AD_SELECT_WITH_RELATIONS, mapAdRow, type AdRow } from "@/lib/supabase/ads";

// Annonces de l'utilisateur connecté, tous statuts confondus sauf DELETED
// (jamais exposées via la clé anon — voir schema.sql — donc pas de risque à
// renvoyer PENDING_PAYMENT/OFFLINE ici, réservé au propriétaire authentifié).
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ads")
    .select(AD_SELECT_WITH_RELATIONS)
    .eq("user_id", session.userId)
    .neq("status", "DELETED")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération de vos annonces." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    ads: (data as unknown as AdRow[] | null)?.map(mapAdRow) || [],
  });
}
