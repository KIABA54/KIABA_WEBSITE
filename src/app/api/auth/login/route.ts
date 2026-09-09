import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSession, verifyPassword } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponseBody } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const ip = getClientIp(req);

    // Anti brute-force sur le login.
    const [emailLimit, ipLimit] = await Promise.all([
      checkRateLimit(`login:email:${normalizedEmail}`, 10, 15 * 60),
      checkRateLimit(`login:ip:${ip}`, 30, 15 * 60),
    ]);
    if (!emailLimit.allowed || !ipLimit.allowed) {
      return NextResponse.json(rateLimitResponseBody(), { status: 429 });
    }

    const supabase = createAdminClient();
    const { data: user } = await supabase
      .from("users")
      .select("id, email, username, password_hash")
      .eq("email", normalizedEmail)
      .maybeSingle();

    // Message générique volontaire : ne pas indiquer si c'est l'email ou le
    // mot de passe qui est incorrect (évite l'énumération de comptes).
    const genericError = { error: "Email ou mot de passe incorrect." };

    if (!user) {
      return NextResponse.json(genericError, { status: 401 });
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) {
      return NextResponse.json(genericError, { status: 401 });
    }

    await createSession(user.id, user.email);

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error: unknown) {
    console.error("[API auth/login] Erreur:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
