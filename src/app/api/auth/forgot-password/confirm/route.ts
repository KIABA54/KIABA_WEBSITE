import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword, createSession } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponseBody } from "@/lib/rateLimit";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
  const { email, code, newPassword } = await req.json();
  if (!email || !code || !newPassword) {
    return NextResponse.json({ error: "Email, code et nouveau mot de passe requis." }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const ip = getClientIp(req);

  const [emailLimit, ipLimit] = await Promise.all([
    checkRateLimit(`forgot-password:confirm:email:${normalizedEmail}`, 10, 15 * 60),
    checkRateLimit(`forgot-password:confirm:ip:${ip}`, 30, 15 * 60),
  ]);
  if (!emailLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json(rateLimitResponseBody(), { status: 429 });
  }

  const supabase = createAdminClient();

  const { data: otpEntry } = await supabase
    .from("otp_codes")
    .select("id")
    .eq("email", normalizedEmail)
    .eq("code", code)
    .eq("type", "PASSWORD_RESET")
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpEntry) {
    return NextResponse.json({ error: "Code invalide, expiré ou déjà utilisé." }, { status: 400 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }

  await supabase.from("otp_codes").update({ used: true }).eq("id", otpEntry.id);

  const passwordHash = await hashPassword(newPassword);
  const { error } = await supabase.from("users").update({ password_hash: passwordHash }).eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour du mot de passe." }, { status: 500 });
  }

  // Auto-login après réinitialisation réussie, comme pour l'inscription.
  await createSession(user.id, normalizedEmail);

  return NextResponse.json({ success: true });
}
