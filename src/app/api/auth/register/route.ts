import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { checkRateLimit, getClientIp, rateLimitResponseBody } from "@/lib/rateLimit";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
  try {
    const { username, email, birthDate, gender, profilePhoto, password } = await req.json();

    if (!username || !email || !birthDate || !profilePhoto || !password) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être renseignés, y compris la photo de profil." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Anti-spam sur la demande d'OTP : par email et par IP.
    const ip = getClientIp(req);
    const [emailLimit, ipLimit] = await Promise.all([
      checkRateLimit(`register:email:${normalizedEmail}`, 5, 15 * 60),
      checkRateLimit(`register:ip:${ip}`, 20, 15 * 60),
    ]);
    if (!emailLimit.allowed || !ipLimit.allowed) {
      return NextResponse.json(rateLimitResponseBody(), { status: 429 });
    }

    const supabase = createAdminClient();

    // 1. RÈGLE STRICTE : VÉRIFICATION BLACKLIST EMAIL
    // Toute adresse email liée à un compte supprimé est bannie à vie.
    const { data: blacklisted } = await supabase
      .from("blacklisted_emails")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (blacklisted) {
      return NextResponse.json(
        {
          error:
            "Cette adresse email a été définitivement bannie de la plateforme suite à une suppression de compte. L'inscription est impossible.",
        },
        { status: 403 }
      );
    }

    // 2. Vérification qu'un compte n'existe pas déjà avec cet email
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cette adresse email." },
        { status: 409 }
      );
    }

    // 3. Le mot de passe est hashé dès cette étape : il ne doit jamais
    // transiter en clair au-delà de cette requête (y compris dans le
    // stockage temporaire otp_codes.metadata).
    const passwordHash = await hashPassword(password);

    // 4. Génération d'un code OTP à 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 5. Stockage du code OTP temporaire (validité 10 minutes)
    const { error: insertError } = await supabase.from("otp_codes").insert({
      email: normalizedEmail,
      code: otpCode,
      type: "REGISTRATION",
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      metadata: {
        username,
        birthDate,
        gender,
        profilePhoto,
        passwordHash,
      },
    });

    if (insertError) {
      return NextResponse.json({ error: "Erreur lors de la génération du code de vérification." }, { status: 500 });
    }

    await sendOtpEmail(normalizedEmail, otpCode);

    return NextResponse.json({
      success: true,
      message: "Code OTP envoyé par email",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
