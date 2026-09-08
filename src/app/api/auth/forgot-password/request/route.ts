import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendForgotPasswordOtpEmail } from "@/lib/email";
import { checkRateLimit, getClientIp, rateLimitResponseBody } from "@/lib/rateLimit";

// Mot de passe oublié, utilisateur DÉCONNECTÉ (voir /api/auth/change-password
// pour le changement depuis un profil déjà connecté). Réponse volontairement
// générique dans tous les cas pour ne pas révéler si l'email existe.
export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email requis." }, { status: 400 });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const ip = getClientIp(req);

  const [emailLimit, ipLimit] = await Promise.all([
    checkRateLimit(`forgot-password:email:${normalizedEmail}`, 5, 15 * 60),
    checkRateLimit(`forgot-password:ip:${ip}`, 20, 15 * 60),
  ]);
  if (!emailLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json(rateLimitResponseBody(), { status: 429 });
  }

  const genericResponse = NextResponse.json({
    success: true,
    message: "Si un compte existe avec cette adresse, un code de réinitialisation vient d'être envoyé.",
  });

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!user) {
    return genericResponse;
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const { error } = await supabase.from("otp_codes").insert({
    email: normalizedEmail,
    code: otpCode,
    type: "PASSWORD_RESET",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  if (!error) {
    await sendForgotPasswordOtpEmail(normalizedEmail, otpCode);
  }

  return genericResponse;
}
