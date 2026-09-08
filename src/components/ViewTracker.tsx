"use client";

import { useEffect } from "react";

/**
 * Composant invisible : signale une vue réelle au chargement de la page.
 * Volontairement côté client (pas dans le rendu serveur) — un robot
 * d'indexation qui ne lit que le HTML n'exécute jamais ce fetch, donc il ne
 * gonfle jamais le compteur.
 */
export default function ViewTracker({ adId }: { adId: string }) {
  useEffect(() => {
    fetch(`/api/ads/${adId}/view`, { method: "POST" }).catch(() => {
      // Une vue manquée n'est pas grave — pas de retry, pas de message d'erreur.
    });
  }, [adId]);

  return null;
}
