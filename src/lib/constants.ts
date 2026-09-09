// =========================================================================
// CONSTANTES ET RÈGLES DE GESTION - KIABA RENCONTRE
// =========================================================================

export const SITE_NAME = "KIABA RENCONTRE";
export const SITE_TAGLINE = "Petites annonces pour adultes en toute discrétion";
// Logo affiché dans le header du site et l'en-tête des emails.
export const SITE_LOGO_URL =
  "https://vhhixwrzekglldtgskfp.supabase.co/storage/v1/object/public/ITEMS/logokiaba.png";
// Icône d'onglet navigateur — distincte du logo (format carré adapté).
export const SITE_FAVICON_URL =
  "https://vhhixwrzekglldtgskfp.supabase.co/storage/v1/object/public/ITEMS/favicon.png";
// Image affichée quand un lien du site est partagé (Open Graph / Twitter Card).
export const SITE_OG_IMAGE_URL =
  "https://vhhixwrzekglldtgskfp.supabase.co/storage/v1/object/public/ITEMS/kiabaog.png";

// Âge minimum légal pour s'inscrire — site pour adultes uniquement. Vérifié
// UNIQUEMENT côté client jusqu'ici (formulaire d'inscription) : sans ce
// contrôle serveur, un appel direct à /api/auth/register avec une date de
// naissance de mineur passait sans être bloqué.
export const MIN_AGE = 18;

export function isAdultBirthDate(birthDate: string): boolean {
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= MIN_AGE;
}

// Formules d'annonces
export interface FormulaConfig {
  id: "STANDARD" | "PRO" | "PRO_PLUS" | "VIP";
  name: string;
  price: number; // en FCFA
  durationDays: number;
  highlightDays: number;
  badgeLabel: string;
  badgeColor: string;
  isPopular?: boolean;
  description: string;
}

export const FORMULAS: Record<string, FormulaConfig> = {
  STANDARD: {
    id: "STANDARD",
    name: "Standard",
    price: 1200,
    durationDays: 7,
    highlightDays: 0,
    badgeLabel: "STANDARD",
    badgeColor: "bg-slate-200 text-slate-800",
    description: "Durée 7 jours, publication standard (1ère annonce GRATUITE pour les nouveaux comptes)",
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    price: 3400,
    durationDays: 10,
    highlightDays: 7,
    badgeLabel: "PRO",
    badgeColor: "bg-gradient-to-r from-brand-blue-800 to-brand-blue-600 text-white font-bold",
    description: "Durée 10 jours, mise en avant garantie pendant 7 jours",
  },
  PRO_PLUS: {
    id: "PRO_PLUS",
    name: "Pro (+)",
    price: 5600,
    durationDays: 15,
    highlightDays: 15,
    badgeLabel: "PRO (+)",
    badgeColor: "bg-gradient-to-r from-brand-pink-500 to-brand-blue-800 text-white font-bold",
    isPopular: true,
    description: "Durée 15 jours, mise en avant pendant TOUTE la durée de vie",
  },
  VIP: {
    id: "VIP",
    name: "VIP",
    price: 15800,
    durationDays: 30,
    highlightDays: 30,
    badgeLabel: "VIP",
    badgeColor: "bg-gradient-to-r from-amber-500 via-brand-pink-500 to-brand-pink-700 text-white font-extrabold shadow-md",
    description: "Durée 30 jours, visibilité maximale et mise en avant permanente sur 30 jours",
  },
};

export interface RenewalUpdate {
  status: "ONLINE";
  expires_at: string;
  highlight_expires_at: string | null;
  is_boosted: false;
  boosted_at: null;
}

/**
 * Champs à écrire sur `ads` pour un renouvellement, à partir de la formule
 * d'ORIGINE de l'annonce (jamais une valeur en dur — cette même erreur a
 * déjà été commise séparément dans /api/payments/initiate et le webhook
 * GeniusPay avant d'être corrigée aux deux endroits ; centralisé ici pour
 * qu'un futur correctif n'ait plus à être répété deux fois).
 *
 * Remet aussi `is_boosted` à `false` : le renouvellement est payé au prix
 * de la formule seule, jamais au prix boost — sans ce reset, une annonce
 * boostée puis expirée puis renouvelée restait boostée gratuitement et
 * indéfiniment (triée en tête de liste sans jamais avoir repayé pour ça).
 */
export function computeRenewalUpdate(formulaConfig: FormulaConfig): RenewalUpdate {
  const now = Date.now();
  return {
    status: "ONLINE",
    expires_at: new Date(now + formulaConfig.durationDays * 24 * 3600 * 1000).toISOString(),
    highlight_expires_at:
      formulaConfig.highlightDays > 0
        ? new Date(now + formulaConfig.highlightDays * 24 * 3600 * 1000).toISOString()
        : null,
    is_boosted: false,
    boosted_at: null,
  };
}

// Tarifs des opérations
export const EDIT_AD_PRICE = 999; // Modification d'annonce en FCFA
export const BOOST_PERCENTAGE = 0.60; // 60% du prix d'origine de la formule

// Longueur minimale du titre/de la description — contrôlée côté client ET
// serveur avec ces mêmes constantes (POST /api/ads, PATCH /api/ads/[id]) :
// sans le contrôle serveur, un appel direct à l'API avec un titre/une
// description quasi vide publiait une annonce réelle et visible.
export const MIN_AD_TITLE_LENGTH = 10;
export const MIN_AD_DESCRIPTION_LENGTH = 20;
// Dupliqué à 4 endroits avant (2 formulaires + 2 routes API) — regroupé ici
// pour ne plus avoir à le changer séparément à chaque fois.
export const MAX_AD_PHOTOS = 5;

// Catégories et Sous-catégories obligatoires
export const CATEGORIES = [
  {
    id: "escorte-girl",
    label: "Escorte Girl",
    icon: "Heart",
    subcategories: [
      "Vaginal",
      "Anal / sodomie",
      "Fellation",
      "Escorte événementielle",
      "Partouze",
    ],
  },
  {
    id: "escorte-boy",
    label: "Escorte Boy",
    icon: "User",
    subcategories: [
      "Passif",
      "Actif",
      "Escorte événementielle",
    ],
  },
  {
    id: "transgenre",
    label: "Transgenre",
    icon: "Sparkles",
    subcategories: [
      "Femme trans",
      "Homme trans",
      "Escorte événementielle",
    ],
  },
  {
    id: "massage",
    label: "Massage",
    icon: "Flame",
    subcategories: [
      "Massage relaxant",
      "Massage bien-être",
      "Massage à domicile",
      "Massage duo",
      "Massage VIP",
    ],
  },
] as const;

// Villes couvertes par le site — liste fermée : la création d'annonce et les
// filtres ne proposent que ces villes (fini le champ libre). `id` est la
// valeur stockée en base (déjà en minuscules, ex: "abidjan"), `label` est le
// nom affiché avec orthographe correcte. Toujours triée par ordre
// alphabétique (localeCompare "fr") avant export, quel que soit l'ordre
// d'ajout ci-dessous — ne pas la retrier manuellement.
const CITIES_UNSORTED = [
  { id: "abidjan", label: "Abidjan" },
  { id: "bingerville", label: "Bingerville" },
  { id: "san-pedro", label: "San-Pédro" },
  { id: "abengourou", label: "Abengourou" },
  { id: "bouake", label: "Bouaké" },
  { id: "korhogo", label: "Korhogo" },
  { id: "daloa", label: "Daloa" },
  { id: "yamoussoukro", label: "Yamoussoukro" },
  { id: "tengrela", label: "Tengréla" },
  { id: "mankono", label: "Mankono" },
  { id: "tiassale", label: "Tiassalé" },
  { id: "bondoukou", label: "Bondoukou" },
  { id: "grand-bassam", label: "Grand-Bassam" },
  { id: "tabou", label: "Tabou" },
  { id: "dabou", label: "Dabou" },
  { id: "meagui", label: "Méagui" },
  { id: "gagnoa", label: "Gagnoa" },
  { id: "soubre", label: "Soubré" },
  { id: "issia", label: "Issia" },
  { id: "yabayo", label: "Yabayo" },
  { id: "vavoua", label: "Vavoua" },
  { id: "agboville", label: "Agboville" },
  { id: "guiglo", label: "Guiglo" },
  { id: "man", label: "Man" },
  { id: "boundiali", label: "Boundiali" },
  { id: "ferkessedougou", label: "Ferkessédougou" },
  { id: "odienne", label: "Odienné" },
  { id: "seguela", label: "Séguéla" },
  { id: "sassandra", label: "Sassandra" },
  { id: "anyama", label: "Anyama" },
  { id: "jacqueville", label: "Jacqueville" },
  { id: "divo", label: "Divo" },
  { id: "oume", label: "Oumé" },
  { id: "sinfra", label: "Sinfra" },
  { id: "bonon", label: "Bonon" },
] as const;

export const CITIES = [...CITIES_UNSORTED].sort((a, b) =>
  a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
);

export function getCityLabel(cityId: string): string {
  return CITIES.find((c) => c.id === cityId)?.label || cityId;
}

// Types de clientèle acceptée
export const CLIENT_TYPES = [
  { id: "HOMME", label: "Homme" },
  { id: "FEMME", label: "Femme" },
  { id: "TRANSGENRE", label: "Transgenre" },
  { id: "TOUS", label: "Tout type de sexe" },
] as const;

// Canaux de contact
export const CONTACT_CHANNELS = [
  { id: "WHATSAPP", label: "WhatsApp uniquement" },
  { id: "CALL", label: "Appel téléphonique uniquement" },
  { id: "BOTH", label: "WhatsApp et Appel" },
] as const;

// Genres d'utilisateurs à l'inscription
export const GENDERS = ["Femme", "Homme", "Transgenre"] as const;
