import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponseBody } from "@/lib/rateLimit";

const VIEWED_COOKIE_PREFIX = "kiaba_viewed_";
// Au-delà de cette fenêtre, revoir la même annonce recompte comme une
// nouvelle vue — évite qu'un cookie jamais expiré ne bloque le comptage
// d'un visiteur qui revient légitimement des semaines plus tard.
const DEDUP_WINDOW_SECONDS = 12 * 60 * 60; // 12h

// Incrémente le compteur de vues d'une annonce — appelé par un petit
// composant client (ViewTracker) au chargement de la page détail, jamais
// depuis le rendu serveur : ça exclut naturellement les robots d'indexation
// (qui n'exécutent pas ce JS) du comptage, sans avoir à les détecter par
// User-Agent.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    const cookieStore = await cookies();
    const cookieName = `${VIEWED_COOKIE_PREFIX}${id}`;

    if (cookieStore.get(cookieName)) {
      return NextResponse.json({ success: true, counted: false });
    }

    // Anti-abus best-effort : même mécanisme "fenêtre fixe" que le reste du
    // site, au cas où quelqu'un supprimerait son cookie en boucle pour
    // gonfler artificiellement le compteur d'une annonce.
    const rateLimit = await checkRateLimit(`ads:view:${getClientIp(req)}`, 60, 15 * 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(rateLimitResponseBody(), { status: 429 });
    }

    const supabase = createAdminClient();
    const { data: ad } = await supabase
      .from("ads")
      .select("id, user_id, status")
      .eq("id", id)
      .maybeSingle();

    if (!ad || ad.status !== "ONLINE") {
      return NextResponse.json({ success: true, counted: false });
    }

    // Le propriétaire qui consulte sa propre annonce ne doit jamais gonfler
    // son propre compteur de vues.
    if (session && session.userId === ad.user_id) {
      return NextResponse.json({ success: true, counted: false });
    }

    await supabase.rpc("increment_ad_views", { ad_id: id });

    const response = NextResponse.json({ success: true, counted: true });
    response.cookies.set(cookieName, "1", {
      maxAge: DEDUP_WINDOW_SECONDS,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error: unknown) {
    console.error("[API ads/:id/view] Erreur:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
