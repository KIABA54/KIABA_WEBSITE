import { describe, it, expect } from "vitest";
import { validateAdContent } from "./moderation";

describe("validateAdContent", () => {
  it("accepts normal content", () => {
    const result = validateAdContent("Belle rencontre à Abidjan", "Disponible ce soir, contactez-moi.");
    expect(result.isValid).toBe(true);
  });

  it("blocks an exact prohibited keyword", () => {
    const result = validateAdContent("annonce", "je suis raciste et fière de l'être");
    expect(result.isValid).toBe(false);
  });

  it("blocks a keyword even without accents (bypass attempt)", () => {
    const result = validateAdContent("annonce", "contenu nazisme assume");
    expect(result.isValid).toBe(false);
  });

  it("blocks a keyword written with accents that normalize to a banned term", () => {
    // "négre" (avec accent) doit être détecté tout comme "negre".
    const result = validateAdContent("annonce", "propos négre inacceptables");
    expect(result.isValid).toBe(false);
  });

  it("does NOT flag innocuous words that merely contain a banned substring", () => {
    // Régression : avant le correctif, le fallback .includes() bloquait
    // "raviolis"/"violoniste" à cause du mot interdit "viol".
    const result = validateAdContent("Soirée entre amis", "On mange des raviolis avec un violoniste.");
    expect(result.isValid).toBe(true);
  });

  it("still blocks the real word even at a sentence boundary", () => {
    const result = validateAdContent("annonce", "Cette pratique relève du viol.");
    expect(result.isValid).toBe(false);
  });

  it("blocks mentions of minors", () => {
    const result = validateAdContent("annonce", "jeune fille de 15 ans disponible");
    expect(result.isValid).toBe(false);
  });

  it("blocks a banned word regardless of case (bypass attempt)", () => {
    const result = validateAdContent("annonce", "contenu HITLER en majuscules");
    expect(result.isValid).toBe(false);
  });

  it("blocks a banned word hidden in the title, not just the description", () => {
    const result = validateAdContent("annonce esclave à vendre", "texte anodin");
    expect(result.isValid).toBe(false);
  });

  it("blocks a banned word at the very start or end of the text", () => {
    expect(validateAdContent("torture", "annonce anodine").isValid).toBe(false);
    expect(validateAdContent("annonce anodine", "sequestration").isValid).toBe(false);
  });

  it("blocks a banned word immediately followed by punctuation", () => {
    const result = validateAdContent("annonce", "Pratique du viol, inacceptable.");
    expect(result.isValid).toBe(false);
  });

  it("does not flag words that merely share a prefix with a banned term", () => {
    // "man" seul n'est pas interdit, mais on vérifie que le mot "maman" (qui
    // contient "man") n'est pas bloqué par erreur si "man" venait à être
    // ajouté à la liste un jour — garde-fou sur le principe de frontière de mot.
    const result = validateAdContent("annonce", "je vis chez ma maman actuellement");
    expect(result.isValid).toBe(true);
  });

  it("stays valid for a long realistic ad description with no banned terms", () => {
    const result = validateAdContent(
      "Belle rencontre chaleureuse à Abidjan",
      "Disponible du lundi au samedi, reçoit ou se déplace, ambiance discrète et respectueuse. Contactez-moi pour plus d'informations."
    );
    expect(result.isValid).toBe(true);
  });

  it("returns a reason string when content is rejected", () => {
    const result = validateAdContent("annonce", "propos raciste inacceptables");
    expect(result.isValid).toBe(false);
    expect(typeof result.reason).toBe("string");
    expect(result.reason!.length).toBeGreaterThan(0);
  });
});
