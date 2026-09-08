// =========================================================================
// FILTRE AUTOMATIQUE ANTI-HAINE, ANTI-RACISME ET SÉCURITÉ CONTENU
// =========================================================================

const PROHIBITED_KEYWORDS = [
  // Racisme & Haine
  "negre", "sale noir", "sale blanc", "bougnoule", "chinetoque", "youpin",
  "ratonnade", "nazisme", "hitler", "antisemite", "raciste", "suprematie",
  // Pédopornographie & mineurs (Tolérance Zéro Absolue)
  "mineur", "mineure", "enfant", "pedophile", "lyceenne", "collegienne",
  "12 ans", "13 ans", "14 ans", "15 ans", "16 ans", "17 ans", "bebe",
  // Violences & Contraintes
  "viol", "forcee", "esclave", "torture", "sequestration", "drogue a son insu",
  "agression", "traite humaine", "contrainte",
];

export function validateAdContent(title: string, description: string): { isValid: boolean; reason?: string } {
  const combinedText = `${title} ${description}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Enlève les accents pour éviter le contournement

  for (const keyword of PROHIBITED_KEYWORDS) {
    const normalizedKeyword = keyword
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Regex frontière de mots
    const regex = new RegExp(`\\b${normalizedKeyword}\\b`, "i");
    if (regex.test(combinedText) || combinedText.includes(normalizedKeyword)) {
      return {
        isValid: false,
        reason: `Votre annonce contient des termes interdits contraires aux conditions d'utilisation ("${keyword}"). Tout contenu raciste, haineux, violent ou illégal est strictement prohibé.`,
      };
    }
  }

  return { isValid: true };
}
