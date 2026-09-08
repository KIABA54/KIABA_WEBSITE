import { Resend } from "resend";

// Envoi d'email transactionnel via Resend. En l'absence de clé API (dev
// local sans compte Resend configuré), on se contente de logger le contenu
// en console pour ne pas bloquer le développement — mais jamais en
// production, où une clé manquante doit être une erreur explicite.
export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  devFallbackLabel: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[${params.devFallbackLabel}] (mode dev, pas d'envoi réel) destinataire=${params.to}`);
      return;
    }
    throw new Error("RESEND_API_KEY n'est pas configuré : envoi d'email impossible en production.");
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || "contact@kiabarencontre.com";

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    throw new Error(`Échec de l'envoi de l'email via Resend: ${error.message}`);
  }
}

export async function sendOtpEmail(email: string, otpCode: string): Promise<void> {
  await sendTransactionalEmail({
    to: email,
    subject: "Votre code de vérification KIABA RENCONTRE",
    html: `<p>Votre code de vérification est : <strong>${otpCode}</strong></p><p>Il expire dans 10 minutes. Ne le partagez avec personne.</p>`,
    devFallbackLabel: `Email OTP KIABA RENCONTRE - code ${otpCode}`,
  });
}
