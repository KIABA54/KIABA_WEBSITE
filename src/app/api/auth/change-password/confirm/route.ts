import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, hashPassword } from "@/lib/auth";
import { checkRateLimit, rateLimitResponseBody } from "@/lib/rateLimit";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { code, newPassword } = await req.json();
  if (!code || !newPassword) {
    return NextResponse.json({ error: "Code et nouveau mot de passe requis." }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` },
      { status: 400 }
    );
  }

  const limit = await checkRateLimit(`change-password:confirm:${session.userId}`, 10, 15 * 60);
  if (!limit.allowed) {
    return NextResponse.json(rateLimitResponseBody(), { status: 429 });
  }

  const supabase = createAdminClient();

  const { data: otpEntry } = await supabase
    .from("otp_codes")
    .select("id")
    .eq("email", session.email)
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

  await supabase.from("otp_codes").update({ used: true }).eq("id", otpEntry.id);

  const passwordHash = await hashPassword(newPassword);
  const { error } = await supabase
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", session.userId);

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour du mot de passe." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
