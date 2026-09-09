const ACCENT_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

// Génère un slug lisible et sûr pour une URL à partir d'un titre libre
// (accents retirés, tout ce qui n'est pas alphanumérique devient un tiret).
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(ACCENT_MARKS, "") // retire les accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, ""); // retire un tiret laissé par la troncature
}

/** Construit le segment d'URL complet "slug-titre-<uuid>" pour un lien d'annonce. */
export function buildAdSlug(title: string, id: string): string {
  const slug = slugify(title);
  return slug ? `${slug}-${id}` : id;
}

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Extrait l'UUID réel d'un segment d'URL "slug-titre-<uuid>" — l'UUID est
 * la véritable clé de recherche, le slug n'est que cosmétique/SEO. Reste
 * compatible avec les anciens liens qui étaient juste l'UUID nu (déjà
 * indexés par Google/Bing avant ce changement).
 */
export function extractAdId(slugOrId: string): string {
  const match = slugOrId.match(UUID_PATTERN);
  return match ? match[0] : slugOrId;
}
