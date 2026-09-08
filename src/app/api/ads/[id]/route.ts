import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { AD_SELECT_WITH_RELATIONS, mapAdRow, type AdRow } from "@/lib/supabase/ads";

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

    const { data: ad } = await supabase.from("ads").select("id, user_id, status").eq("id", id).maybeSingle();
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

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
