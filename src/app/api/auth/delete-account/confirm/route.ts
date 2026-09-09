import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, clearSession } from "@/lib/auth";
import { sendAccountDeletedEmail } from "@/lib/email";
import { runInBackground } from "@/lib/backgroundTask";
import { checkRateLimit, rateLimitResponseBody } from "@/lib/rateLimit";

// Purge définitive du compte : vérifie le code OTP envoyé par
// /api/auth/delete-account/request, puis supprime l'utilisateur (les
// annonces/photos/transactions liées suivent par cascade FK) et bannit son
// email à vie dans blacklisted_emails — règle stricte du cahier des charges.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "Code de confirmation requis." }, { status: 400 });
  }

  const limit = await checkRateLimit(`delete-account:confirm:${session.userId}`, 10, 15 * 60);
  if (!limit.allowed) {
    return NextResponse.json(rateLimitResponseBody(), { status: 429 });
  }

  const supabase = createAdminClient();

  const { data: otpEntry } = await supabase
    .from("otp_codes")
    .select("id")
    .eq("email", session.email)
    .eq("code", code)
    .eq("type", "ACCOUNT_DELETION")
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpEntry) {
    return NextResponse.json({ error: "Code de confirmation invalide, expiré ou déjà utilisé." }, { status: 400 });
  }

  await supabase.from("otp_codes").update({ used: true }).eq("id", otpEntry.id);

  const email = session.email;

  const { error: blacklistError } = await supabase
    .from("blacklisted_emails")
    .insert({ email, reason: "ACCOUNT_DELETED_BY_USER" });
  if (blacklistError) {
    return NextResponse.json({ error: "Erreur lors de la suppression du compte." }, { status: 500 });
  }

  const { error: deleteError } = await supabase.from("users").delete().eq("id", session.userId);
  if (deleteError) {
    return NextResponse.json({ error: "Erreur lors de la suppression du compte." }, { status: 500 });
  }

  await clearSession();

  runInBackground(() => sendAccountDeletedEmail(email));

  return NextResponse.json({ success: true });
}
