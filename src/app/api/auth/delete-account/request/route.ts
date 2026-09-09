import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, generateOtpCode } from "@/lib/auth";
import { sendAccountDeletionOtpEmail } from "@/lib/email";
import { runInBackground } from "@/lib/backgroundTask";
import { checkRateLimit, rateLimitResponseBody } from "@/lib/rateLimit";

// Envoie le code OTP requis pour confirmer une suppression de compte.
// Ne supprime rien : voir /api/auth/delete-account/confirm.
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const limit = await checkRateLimit(`delete-account:request:${session.userId}`, 5, 15 * 60);
  if (!limit.allowed) {
    return NextResponse.json(rateLimitResponseBody(), { status: 429 });
  }

  const otpCode = generateOtpCode();
  const supabase = createAdminClient();

  const { error } = await supabase.from("otp_codes").insert({
    email: session.email,
    code: otpCode,
    type: "ACCOUNT_DELETION",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la génération du code de confirmation." }, { status: 500 });
  }

  runInBackground(() => sendAccountDeletionOtpEmail(session.email, otpCode));

  return NextResponse.json({ success: true, message: "Code de confirmation envoyé par email." });
}
