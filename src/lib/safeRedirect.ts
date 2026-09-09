/**
 * Un paramètre `?next=` de redirection post-connexion doit toujours rester
 * interne au site. `"/foo"` est sûr ; `"//evil.com"` COMMENCE aussi par "/"
 * mais un navigateur le traite comme une URL "protocol-relative" — donc
 * une redirection externe. Sans ce deuxième contrôle, un lien du type
 * "/connexion?next=//evil.com" envoyé à une victime la redirigerait vers
 * un site tiers juste après sa connexion (hameçonnage).
 */
export function isSafeRedirectPath(path: string | null | undefined): path is string {
  return Boolean(path) && path!.startsWith("/") && !path!.startsWith("//");
}
