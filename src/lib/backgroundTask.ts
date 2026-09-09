import { after } from "next/server";

/**
 * Exécute `task` sans jamais faire attendre la réponse HTTP en cours (utile
 * pour les envois d'email : un aller-retour SMTP peut prendre plusieurs
 * secondes, et rien ne justifie de faire patienter l'utilisateur pour ça —
 * l'action elle-même, ex. la publication d'une annonce, est déjà terminée).
 *
 * Utilise `after()` de Next.js quand c'est possible (garantit que la tâche
 * se termine réellement même sur une fonction serverless, contrairement à un
 * simple appel non attendu qui peut être tué dès la réponse envoyée).
 * `after()` lève une erreur hors du contexte d'une vraie requête Next.js
 * (ex: appelé directement depuis un test unitaire) — dans ce cas on retombe
 * sur un appel "fire and forget" classique, suffisant hors production réelle.
 */
export function runInBackground(task: () => Promise<unknown>): void {
  try {
    after(task);
  } catch {
    task().catch(() => {});
  }
}
