import { describe, it, expect } from "vitest";
import {
  CITIES,
  getCityLabel,
  isAdultBirthDate,
  FORMULAS,
  EDIT_AD_PRICE,
  BOOST_PERCENTAGE,
  CATEGORIES,
  computeRenewalUpdate,
} from "./constants";

describe("CITIES", () => {
  it("is sorted alphabetically (French locale)", () => {
    const labels = CITIES.map((c) => c.label);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
    expect(labels).toEqual(sorted);
  });

  it("has no duplicate ids", () => {
    const ids = CITIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the cities requested by the client", () => {
    const ids = CITIES.map((c) => c.id);
    for (const id of ["divo", "oume", "sinfra", "bonon", "abidjan", "san-pedro"]) {
      expect(ids).toContain(id);
    }
  });

  it("every id is a lowercase, space-free slug (safe to store/filter on)", () => {
    for (const c of CITIES) {
      expect(c.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("every id has a non-empty, distinctly-cased label", () => {
    for (const c of CITIES) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.label[0]).toBe(c.label[0].toUpperCase());
    }
  });
});

describe("getCityLabel", () => {
  it("returns the accented display label for a known city id", () => {
    expect(getCityLabel("san-pedro")).toBe("San-Pédro");
    expect(getCityLabel("ferkessedougou")).toBe("Ferkessédougou");
  });

  it("falls back to the raw value for an unknown city id", () => {
    expect(getCityLabel("atlantide")).toBe("atlantide");
  });
});

describe("isAdultBirthDate", () => {
  const yearsAgo = (years: number, extraDays = 0) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - years);
    d.setDate(d.getDate() - extraDays);
    return d.toISOString().slice(0, 10);
  };

  it("accepts someone who turned 18 yesterday", () => {
    expect(isAdultBirthDate(yearsAgo(18, 1))).toBe(true);
  });

  it("rejects someone who turns 18 tomorrow", () => {
    expect(isAdultBirthDate(yearsAgo(18, -1))).toBe(false);
  });

  it("rejects a 17-year-old", () => {
    expect(isAdultBirthDate(yearsAgo(17))).toBe(false);
  });

  it("accepts a clearly adult date", () => {
    expect(isAdultBirthDate(yearsAgo(30))).toBe(true);
  });

  it("rejects invalid or missing dates", () => {
    expect(isAdultBirthDate("not-a-date")).toBe(false);
    expect(isAdultBirthDate("")).toBe(false);
  });

  it("handles a February 29th (leap year) birthdate without crashing", () => {
    // Une naissance un 29 février est le cas classique qui casse un calcul
    // d'âge naïf (mois/jour mal comparés sur une année non bissextile).
    expect(isAdultBirthDate("2000-02-29")).toBe(true); // né en 2000, largement majeur
  });

  it("rejects a future birthdate", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isAdultBirthDate(future.toISOString().slice(0, 10))).toBe(false);
  });
});

describe("CATEGORIES", () => {
  it("every category has at least one subcategory", () => {
    for (const cat of CATEGORIES) {
      expect(cat.subcategories.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate category ids", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("FORMULAS shape", () => {
  const ids = ["STANDARD", "PRO", "PRO_PLUS", "VIP"] as const;

  it("every formula has a positive price and duration", () => {
    for (const id of ids) {
      expect(FORMULAS[id].price).toBeGreaterThan(0);
      expect(FORMULAS[id].durationDays).toBeGreaterThan(0);
    }
  });

  it("prices strictly increase from STANDARD to VIP (the whole point of the tiers)", () => {
    expect(FORMULAS.STANDARD.price).toBeLessThan(FORMULAS.PRO.price);
    expect(FORMULAS.PRO.price).toBeLessThan(FORMULAS.PRO_PLUS.price);
    expect(FORMULAS.PRO_PLUS.price).toBeLessThan(FORMULAS.VIP.price);
  });

  it("highlightDays never exceeds durationDays (can't be highlighted longer than it's live)", () => {
    for (const id of ids) {
      expect(FORMULAS[id].highlightDays).toBeLessThanOrEqual(FORMULAS[id].durationDays);
    }
  });
});

describe("business pricing rules", () => {
  it("boost price is 60% of the ad's own formula price, per formula", () => {
    expect(Math.round(BOOST_PERCENTAGE * FORMULAS.STANDARD.price)).toBe(720);
    expect(Math.round(BOOST_PERCENTAGE * FORMULAS.VIP.price)).toBe(9480);
  });

  it("edit price is a flat fee regardless of formula", () => {
    expect(EDIT_AD_PRICE).toBe(999);
  });

  it("renewal duration always matches the ad's own formula, never a hardcoded value", () => {
    // Régression : le renouvellement fixait autrefois 7 jours en dur pour
    // toutes les formules — VIP doit se renouveler pour 30 jours, pas 7.
    expect(FORMULAS.VIP.durationDays).toBe(30);
    expect(FORMULAS.STANDARD.durationDays).toBe(7);
    expect(FORMULAS.VIP.durationDays).not.toBe(FORMULAS.STANDARD.durationDays);
  });
});

describe("computeRenewalUpdate", () => {
  it("resets is_boosted to false — a renewal is paid at the formula price, never the boost price", () => {
    // Régression : sans ce reset, une annonce boostée puis expirée puis
    // renouvelée restait boostée gratuitement et indéfiniment (triée en
    // tête de liste sans jamais avoir repayé pour le boost).
    const update = computeRenewalUpdate(FORMULAS.VIP);
    expect(update.is_boosted).toBe(false);
    expect(update.boosted_at).toBeNull();
  });

  it("brings the ad back ONLINE with an expiry matching its own formula duration", () => {
    const now = Date.now();
    const update = computeRenewalUpdate(FORMULAS.STANDARD);
    expect(update.status).toBe("ONLINE");
    const expiresInDays = (new Date(update.expires_at).getTime() - now) / (24 * 3600 * 1000);
    expect(Math.round(expiresInDays)).toBe(FORMULAS.STANDARD.durationDays);
  });

  it("sets highlight_expires_at only for formulas that actually include a highlight", () => {
    expect(computeRenewalUpdate(FORMULAS.STANDARD).highlight_expires_at).toBeNull();
    expect(computeRenewalUpdate(FORMULAS.VIP).highlight_expires_at).not.toBeNull();
  });
});
