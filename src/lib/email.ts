import nodemailer, { type Transporter } from "nodemailer";

// Envoi d'email transactionnel via le compte SMTP professionnel du domaine
// (ci-kiaba.com). Sans configuration (dev local sans les identifiants SMTP),
// on se contente de logger le contenu en console — mais jamais en
// production, où une configuration manquante doit être une erreur explicite.
let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error("Configuration SMTP incomplète (SMTP_HOST/SMTP_USER/SMTP_PASSWORD).");
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE !== "false", // true par défaut (port 465, SSL/TLS direct)
    auth: { user, pass },
  });

  return cachedTransporter;
}

export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  devFallbackLabel: string;
}): Promise<void> {
  const hasSmtpConfig = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  );

  if (!hasSmtpConfig) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[${params.devFallbackLabel}] (mode dev, pas d'envoi réel) destinataire=${params.to}`);
      return;
    }
    throw new Error("Configuration SMTP manquante : envoi d'email impossible en production.");
  }

  const from = process.env.EMAIL_FROM || "no_reply@ci-kiaba.com";

  await getTransporter().sendMail({
    from: `KIABA RENCONTRE <${from}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function sendOtpEmail(email: string, otpCode: string): Promise<void> {
  await sendTransactionalEmail({
    to: email,
    subject: "Votre code de vérification KIABA RENCONTRE",
    html: `<p>Votre code de vérification est : <strong>${otpCode}</strong></p><p>Il expire dans 10 minutes. Ne le partagez avec personne.</p>`,
    devFallbackLabel: `Email OTP KIABA RENCONTRE - code ${otpCode}`,
  });
}
