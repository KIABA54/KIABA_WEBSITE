import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSession } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { checkRateLimit, getClientIp, rateLimitResponseBody } from "@/lib/rateLimit";
import { runInBackground } from "@/lib/backgroundTask";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email et code requis." }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const ip = getClientIp(req);

    // Anti brute-force sur la vérification du code (6 chiffres = 1M combinaisons).
    const [emailLimit, ipLimit] = await Promise.all([
      checkRateLimit(`verify-otp:email:${normalizedEmail}`, 10, 15 * 60),
      checkRateLimit(`verify-otp:ip:${ip}`, 30, 15 * 60),
    ]);
    if (!emailLimit.allowed || !ipLimit.allowed) {
      return NextResponse.json(rateLimitResponseBody(), { status: 429 });
    }

    const supabase = createAdminClient();

    // 1. Vérification du code OTP : doit exister, correspondre, ne pas être
    // déjà utilisé et ne pas être expiré.
    const { data: otpEntry } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", code)
      .eq("type", "REGISTRATION")
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpEntry) {
      return NextResponse.json({ error: "Code OTP invalide, expiré ou déjà utilisé." }, { status: 400 });
    }

    // 2. Marquer l'OTP comme utilisé immédiatement pour empêcher la réutilisation.
    await supabase.from("otp_codes").update({ used: true }).eq("id", otpEntry.id);

    const metadata = (otpEntry.metadata || {}) as {
      username?: string;
      birthDate?: string;
      gender?: string;
      profilePhoto?: string;
      passwordHash?: string;
    };

    if (!metadata.passwordHash) {
      return NextResponse.json(
        { error: "Session d'inscription invalide. Veuillez recommencer l'inscription." },
        { status: 400 }
      );
    }

    // 3. Création du compte utilisateur avec le hash déjà calculé à l'étape register.
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        username: metadata.username || "Utilisateur",
        email: normalizedEmail,
        password_hash: metadata.passwordHash,
        birth_date: metadata.birthDate || "2000-01-01",
        gender: metadata.gender || "Femme",
        profile_photo_url: metadata.profilePhoto,
        free_ad_eligible: true, // 1ère annonce Standard gratuite attribuée !
      })
      .select("id, email")
      .single();

    if (insertError || !newUser) {
      const isConflict = insertError?.code === "23505"; // unique_violation (email ou username)
      return NextResponse.json(
        {
          error: isConflict
            ? "Un compte existe déjà avec cet email ou ce nom d'utilisateur."
            : "Erreur lors de la création du compte.",
        },
        { status: isConflict ? 409 : 500 }
      );
    }

    // 4. Auto-login : on pose directement le cookie de session.
    await createSession(newUser.id, newUser.email);

    // 5. Email de bienvenue avec la grille tarifaire complète.
    runInBackground(() => sendWelcomeEmail(newUser.email, metadata.username || "Utilisateur"));

    return NextResponse.json({
      success: true,
      message: "Profil créé avec succès. Bienvenue sur KIABA RENCONTRE !",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
