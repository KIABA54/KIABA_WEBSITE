import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, generateOtpCode } from "@/lib/auth";
import { sendPasswordChangeOtpEmail } from "@/lib/email";
import { checkRateLimit, rateLimitResponseBody } from "@/lib/rateLimit";

// Envoie le code OTP requis pour changer de mot de passe depuis le profil
// (utilisateur déjà connecté). Voir /api/auth/forgot-password pour le cas
// d'un utilisateur déconnecté qui a oublié son mot de passe.
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const limit = await checkRateLimit(`change-password:request:${session.userId}`, 5, 15 * 60);
  if (!limit.allowed) {
    return NextResponse.json(rateLimitResponseBody(), { status: 429 });
  }

  const otpCode = generateOtpCode();
  const supabase = createAdminClient();

  const { error } = await supabase.from("otp_codes").insert({
    email: session.email,
    code: otpCode,
    type: "PASSWORD_RESET",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la génération du code." }, { status: 500 });
  }

  await sendPasswordChangeOtpEmail(session.email, otpCode);

  return NextResponse.json({ success: true, message: "Code envoyé par email." });
}
