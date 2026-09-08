import { SITE_LOGO_URL } from "./constants";

// =========================================================================
// GABARIT D'EMAIL KIABA RENCONTRE
// =========================================================================
// HTML de table classique (pas de CSS externe, pas de flexbox) : c'est la
// seule approche fiable pour les clients email (Outlook, Gmail...).
// Bords volontairement STRICTS/CARRÉS partout (aucun border-radius) —
// choix de style explicite du client, à ne pas "adoucir".

const COLORS = {
  blueDeep: "#1E3A8A",
  blue: "#1E40AF",
  pink: "#EC4899",
  pinkDeep: "#BE185D",
  ink: "#1F2430",
  inkSoft: "#5B5770",
  border: "#DDD8E6",
  bg: "#EFEDF3",
  bgSoft: "#F7F6FA",
  ok: "#0F7A4E",
  okBg: "#E6F6EE",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface LayoutParams {
  preheader?: string;
  eyebrow: string; // petit libellé au-dessus du titre (ex: "VÉRIFICATION", "BIENVENUE")
  heading: string;
  bodyHtml: string;
}

function renderLayout({ preheader, eyebrow, heading, bodyHtml }: LayoutParams): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>KIABA RENCONTRE</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg};padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid ${COLORS.border};">
  <tr>
    <td style="background-color:#ffffff;padding:26px 32px 22px;text-align:left;">
      <img src="${SITE_LOGO_URL}" alt="KIABA RENCONTRE" height="56" style="display:inline-block;height:56px;width:auto;border:0;">
    </td>
  </tr>
  <tr><td style="height:3px;line-height:3px;font-size:0;background-color:${COLORS.pink};">&nbsp;</td></tr>
  <tr>
    <td style="padding:36px 32px 12px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.pinkDeep};">${escapeHtml(eyebrow)}</p>
      <h1 style="margin:0 0 20px;font-size:21px;line-height:1.3;font-weight:800;color:${COLORS.blueDeep};">${escapeHtml(heading)}</h1>
      <div style="font-size:14px;line-height:1.65;color:${COLORS.ink};">
        ${bodyHtml}
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${COLORS.border};font-size:0;line-height:0;">&nbsp;</td></tr></table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px 28px;">
      <p style="margin:0;font-size:11px;line-height:1.7;color:#918DA0;">
        KIABA RENCONTRE — Petites annonces pour adultes en Côte d'Ivoire.<br>
        Cet email vous a été envoyé automatiquement, merci de ne pas y répondre directement.
        Une question ? Écrivez-nous à <a href="mailto:mail@ci-kiaba.com" style="color:${COLORS.pinkDeep};text-decoration:underline;">mail@ci-kiaba.com</a>.<br>
        © ${new Date().getFullYear()} KIABA RENCONTRE — Tous droits réservés.
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Code OTP à 6 chiffres — texte seul, gras et agrandi, sans cadre ni fond. */
function otpCodeBlock(code: string): string {
  const spaced = code.split("").join(" ");
  return `<p style="margin:22px 0;padding:0;">
    <span style="font-family:'Courier New',monospace;font-size:34px;font-weight:800;letter-spacing:6px;color:${COLORS.blueDeep};">${escapeHtml(spaced)}</span>
  </p>`;
}

function ctaButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;">
    <tr><td style="background-color:${COLORS.pink};border-radius:0;">
      <a href="${url}" style="display:inline-block;padding:13px 28px;font-size:13px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:0;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
}

// =========================================================================
// TEMPLATES
// =========================================================================

export function otpTemplate(params: {
  eyebrow: string;
  heading: string;
  introHtml: string;
  code: string;
  footnote?: string;
}): string {
  return renderLayout({
    preheader: `Votre code : ${params.code}`,
    eyebrow: params.eyebrow,
    heading: params.heading,
    bodyHtml: `
      <p style="margin:0 0 4px;">${params.introHtml}</p>
      ${otpCodeBlock(params.code)}
      <p style="margin:0;font-size:12.5px;color:${COLORS.inkSoft};">Ce code expire dans <strong>10 minutes</strong> et ne peut servir qu'une seule fois. Ne le communiquez à personne.</p>
      ${params.footnote ? `<p style="margin:16px 0 0;font-size:12.5px;color:${COLORS.inkSoft};">${params.footnote}</p>` : ""}
    `,
  });
}

export function welcomeTemplate(params: { username: string; appUrl: string }): string {
  const row = (name: string, price: string, detail: string) => `
    <tr>
      <td style="padding:10px 14px;border:1px solid ${COLORS.border};font-size:13px;font-weight:800;color:${COLORS.blueDeep};">${escapeHtml(name)}</td>
      <td style="padding:10px 14px;border:1px solid ${COLORS.border};font-size:13px;font-weight:800;color:${COLORS.pinkDeep};text-align:right;white-space:nowrap;">${escapeHtml(price)}</td>
      <td style="padding:10px 14px;border:1px solid ${COLORS.border};font-size:12px;color:${COLORS.inkSoft};">${escapeHtml(detail)}</td>
    </tr>`;

  return renderLayout({
    preheader: "Votre compte est prêt — voici toutes les formules et tarifs.",
    eyebrow: "Bienvenue",
    heading: `Bienvenue, ${params.username} !`,
    bodyHtml: `
      <p style="margin:0 0 16px;">Votre compte et votre profil KIABA RENCONTRE sont créés. Vous pouvez publier dès maintenant — votre <strong>1ère annonce Standard est offerte</strong>.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 20px;">
        <tr>
          <td style="padding:8px 14px;background-color:${COLORS.bgSoft};border:1px solid ${COLORS.border};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:${COLORS.inkSoft};">Formule</td>
          <td style="padding:8px 14px;background-color:${COLORS.bgSoft};border:1px solid ${COLORS.border};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:${COLORS.inkSoft};text-align:right;">Prix</td>
          <td style="padding:8px 14px;background-color:${COLORS.bgSoft};border:1px solid ${COLORS.border};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:${COLORS.inkSoft};">Détail</td>
        </tr>
        ${row("Standard", "1 200 FCFA", "7 jours — 1ère offerte pour vous")}
        ${row("Pro", "3 400 FCFA", "10 jours, mise en avant 7 jours")}
        ${row("Pro (+)", "5 600 FCFA", "15 jours, mise en avant totale")}
        ${row("VIP", "15 800 FCFA", "30 jours, mise en avant permanente")}
      </table>

      <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:${COLORS.blueDeep};">Bon à savoir</p>
      <ul style="margin:0 0 20px;padding-left:18px;font-size:12.5px;color:${COLORS.inkSoft};line-height:1.7;">
        <li>Boost d'une annonce déjà en ligne : 60&nbsp;% du prix payé, mise en avant jusqu'à expiration.</li>
        <li>Modification d'une annonce active : 999 FCFA.</li>
        <li>Renouvellement après expiration : même prix que la formule d'origine.</li>
      </ul>

      ${ctaButton("Publier ma première annonce", `${params.appUrl}/annonces/nouvelle`)}
    `,
  });
}

export function receiptTemplate(params: {
  typeLabel: string;
  reference: string;
  amountFcfa: number;
  adTitle?: string;
  appUrl: string;
  adId?: string;
}): string {
  const isFree = params.amountFcfa === 0;
  return renderLayout({
    preheader: `${params.typeLabel} confirmée — ${isFree ? "gratuit" : `${params.amountFcfa.toLocaleString("fr-FR")} FCFA`}`,
    eyebrow: "Confirmation",
    heading: `${params.typeLabel} confirmée`,
    bodyHtml: `
      <p style="margin:0 0 20px;"><strong>${escapeHtml(params.typeLabel)}</strong> ${params.adTitle ? `concernant votre annonce « <strong>${escapeHtml(params.adTitle)}</strong> ».` : "— voici votre reçu."}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};margin:0 0 20px;">
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};font-size:12px;color:${COLORS.inkSoft};">Référence</td>
          <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};font-size:12px;font-weight:700;color:${COLORS.ink};text-align:right;font-family:'Courier New',monospace;">${escapeHtml(params.reference)}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};font-size:12px;color:${COLORS.inkSoft};">Statut</td>
          <td style="padding:12px 16px;border-bottom:1px solid ${COLORS.border};font-size:12px;font-weight:700;color:${COLORS.ok};text-align:right;">Payé avec succès</td>
        </tr>
        <tr>
          <td style="padding:14px 16px;font-size:13px;font-weight:800;color:${COLORS.blueDeep};">Montant réglé</td>
          <td style="padding:14px 16px;font-size:15px;font-weight:800;color:${COLORS.pinkDeep};text-align:right;">${isFree ? "0 FCFA (Offert)" : `${params.amountFcfa.toLocaleString("fr-FR")} FCFA`}</td>
        </tr>
      </table>

      ${params.adId ? ctaButton("Voir mon annonce", `${params.appUrl}/annonces/${params.adId}`) : ""}
    `,
  });
}

export function expirationAlertTemplate(params: {
  adTitle: string;
  delayLabel: string; // ex: "48 heures", "24 heures", "1 heure"
  appUrl: string;
  adId: string;
}): string {
  return renderLayout({
    preheader: `Votre annonce « ${params.adTitle} » expire dans ${params.delayLabel}.`,
    eyebrow: "Expiration prochaine",
    heading: `Votre annonce expire dans ${params.delayLabel}`,
    bodyHtml: `
      <p style="margin:0 0 16px;">Votre annonce « <strong>${escapeHtml(params.adTitle)}</strong> » passera automatiquement <strong>hors ligne</strong> dans ${params.delayLabel} si elle n'est pas renouvelée.</p>
      <p style="margin:0 0 4px;font-size:12.5px;color:${COLORS.inkSoft};">Renouvelez-la dès maintenant pour qu'elle reste visible sans interruption.</p>
      ${ctaButton("Renouveler mon annonce", `${params.appUrl}/profil`)}
    `,
  });
}

export function simpleNoticeTemplate(params: { eyebrow: string; heading: string; bodyHtml: string }): string {
  return renderLayout({
    eyebrow: params.eyebrow,
    heading: params.heading,
    bodyHtml: params.bodyHtml,
  });
}
