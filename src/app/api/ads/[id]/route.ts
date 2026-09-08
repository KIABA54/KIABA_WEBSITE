import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
