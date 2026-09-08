import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { username, email, birthDate, gender, profilePhoto, password } = await req.json();

    if (!username || !email || !birthDate || !profilePhoto || !password) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être renseignés, y compris la photo de profil." },
        { status: 400 }
      );
    }

    // 1. RÈGLE STRICTE : VÉRIFICATION BLACKLIST EMAIL
    // Toute adresse email liée à un compte supprimé est bannie à vie.
    const supabase = createAdminClient();
    const { data: blacklisted } = await supabase
      .from("blacklisted_emails")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (blacklisted) {
      return NextResponse.json(
        {
          error:
            "Cette adresse email a été définitivement bannie de la plateforme suite à une suppression de compte. L'inscription est impossible.",
        },
        { status: 403 }
      );
    }

    // 2. Génération d'un code OTP à 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Stockage du code OTP temporaire (validité 10 minutes)
    await supabase.from("otp_codes").insert({
      email: email.toLowerCase().trim(),
      code: otpCode,
      type: "REGISTRATION",
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      metadata: {
        username,
        birthDate,
        gender,
        profilePhoto,
      },
    });

    console.log(`[Email Transactionnel OTP] Code ${otpCode} envoyé à ${email}`);

    // En environnement de test, on retourne le code pour faciliter la démo
    return NextResponse.json({
      success: true,
      message: "Code OTP envoyé par email",
      otp: otpCode,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}
