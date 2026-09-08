import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/email";
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

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
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

  await sendTransactionalEmail({
    to: session.email,
    subject: "Confirmation de suppression de compte — KIABA RENCONTRE",
    html: `<p>Vous avez demandé la suppression définitive de votre compte KIABA RENCONTRE.</p><p>Code de confirmation : <strong>${otpCode}</strong> (valable 10 minutes).</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre compte ne sera pas supprimé sans ce code.</p>`,
    devFallbackLabel: `Email suppression de compte KIABA RENCONTRE - code ${otpCode}`,
  });

  return NextResponse.json({ success: true, message: "Code de confirmation envoyé par email." });
}
