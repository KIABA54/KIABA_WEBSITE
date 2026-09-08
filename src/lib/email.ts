import nodemailer, { type Transporter } from "nodemailer";
import {
  otpTemplate,
  welcomeTemplate,
  receiptTemplate,
  simpleNoticeTemplate,
  expirationAlertTemplate,
} from "./emailTemplates";

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

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendOtpEmail(email: string, otpCode: string): Promise<void> {
  await sendTransactionalEmail({
    to: email,
    subject: "Votre code de vérification — KIABA RENCONTRE",
    html: otpTemplate({
      eyebrow: "Vérification",
      heading: "Confirmez votre inscription",
      introHtml: "Voici votre <strong>code de vérification</strong> pour finaliser la création de votre compte KIABA RENCONTRE :",
      code: otpCode,
    }),
    devFallbackLabel: `Email OTP KIABA RENCONTRE - code ${otpCode}`,
  });
}

export async function sendAccountDeletionOtpEmail(email: string, otpCode: string): Promise<void> {
  await sendTransactionalEmail({
    to: email,
    subject: "Confirmation de suppression de compte — KIABA RENCONTRE",
    html: otpTemplate({
      eyebrow: "Zone sensible",
      heading: "Confirmer la suppression de votre compte",
      introHtml:
        "Vous avez demandé la <strong>suppression définitive</strong> de votre compte. Cette action est <strong>irréversible</strong> : toutes vos annonces seront supprimées et votre adresse email sera définitivement bannie du site.",
      code: otpCode,
      footnote: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre compte ne sera pas supprimé.",
    }),
    devFallbackLabel: `Email suppression de compte KIABA RENCONTRE - code ${otpCode}`,
  });
}

export async function sendAccountDeletedEmail(email: string): Promise<void> {
  await sendTransactionalEmail({
    to: email,
    subject: "Votre compte KIABA RENCONTRE a été supprimé",
    html: simpleNoticeTemplate({
      eyebrow: "Confirmation",
      heading: "Compte supprimé définitivement",
      bodyHtml: `
        <p style="margin:0 0 12px;">Votre compte, votre profil et toutes vos annonces ont été <strong>définitivement supprimés</strong> de notre base de données.</p>
        <p style="margin:0;">Cette adresse email ne pourra <strong>plus jamais</strong> être utilisée pour créer un nouveau compte sur KIABA RENCONTRE.</p>
      `,
    }),
    devFallbackLabel: "Email confirmation suppression de compte KIABA RENCONTRE",
  });
}

export async function sendPasswordChangeOtpEmail(email: string, otpCode: string): Promise<void> {
  await sendTransactionalEmail({
    to: email,
    subject: "Code de changement de mot de passe — KIABA RENCONTRE",
    html: otpTemplate({
      eyebrow: "Sécurité",
      heading: "Changer votre mot de passe",
      introHtml: "Voici votre <strong>code de confirmation</strong> pour changer le mot de passe de votre compte :",
      code: otpCode,
      footnote: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
    }),
    devFallbackLabel: `Email changement mot de passe KIABA RENCONTRE - code ${otpCode}`,
  });
}

export async function sendForgotPasswordOtpEmail(email: string, otpCode: string): Promise<void> {
  await sendTransactionalEmail({
    to: email,
    subject: "Réinitialisation de votre mot de passe — KIABA RENCONTRE",
    html: otpTemplate({
      eyebrow: "Mot de passe oublié",
      heading: "Réinitialiser votre mot de passe",
      introHtml: "Voici votre <strong>code de réinitialisation</strong> :",
      code: otpCode,
      footnote: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email — votre mot de passe reste inchangé.",
    }),
    devFallbackLabel: `Email mot de passe oublié KIABA RENCONTRE - code ${otpCode}`,
  });
}

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  await sendTransactionalEmail({
    to: email,
    subject: "Bienvenue sur KIABA RENCONTRE 🎉",
    html: welcomeTemplate({ username, appUrl: appUrl() }),
    devFallbackLabel: `Email bienvenue KIABA RENCONTRE pour ${username}`,
  });
}

const RECEIPT_TYPE_LABELS: Record<string, string> = {
  NEW_AD: "Publication d'annonce",
  BOOST: "Mise en avant (Boost)",
  RENEWAL: "Renouvellement d'annonce",
  EDIT: "Modification d'annonce",
};

export async function sendReceiptEmail(params: {
  email: string;
  type: "NEW_AD" | "BOOST" | "RENEWAL" | "EDIT";
  reference: string;
  amountFcfa: number;
  adTitle?: string;
  adId?: string;
}): Promise<void> {
  const typeLabel = RECEIPT_TYPE_LABELS[params.type] || "Transaction";
  await sendTransactionalEmail({
    to: params.email,
    subject: `${typeLabel} confirmée — KIABA RENCONTRE`,
    html: receiptTemplate({
      typeLabel,
      reference: params.reference,
      amountFcfa: params.amountFcfa,
      adTitle: params.adTitle,
      adId: params.adId,
      appUrl: appUrl(),
    }),
    devFallbackLabel: `Email reçu KIABA RENCONTRE - ${typeLabel} - réf ${params.reference}`,
  });
}

export async function sendAdExpiringEmail(
  email: string,
  adTitle: string,
  adId: string,
  delayLabel: string
): Promise<void> {
  await sendTransactionalEmail({
    to: email,
    subject: `Votre annonce expire dans ${delayLabel} — KIABA RENCONTRE`,
    html: expirationAlertTemplate({ adTitle, delayLabel, adId, appUrl: appUrl() }),
    devFallbackLabel: `Email alerte expiration (${delayLabel}) KIABA RENCONTRE - ${adTitle}`,
  });
}

export async function sendAdDeletedEmail(email: string, adTitle: string): Promise<void> {
  await sendTransactionalEmail({
    to: email,
    subject: "Votre annonce a été supprimée — KIABA RENCONTRE",
    html: simpleNoticeTemplate({
      eyebrow: "Confirmation",
      heading: "Annonce supprimée",
      bodyHtml: `<p style="margin:0;">Votre annonce « <strong>${adTitle.replace(/</g, "&lt;")}</strong> » a été supprimée définitivement et n'est plus visible sur le site.</p>`,
    }),
    devFallbackLabel: `Email suppression annonce KIABA RENCONTRE - ${adTitle}`,
  });
}
