import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.ci-kiaba.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Pages sans intérêt pour l'indexation : profil privé, formulaires
        // d'authentification, flux de paiement, endpoints API.
        //
        // BUG VÉCU : "/annonces/nouvelle" (sans le "$" de fin) est un préfixe
        // pour un robots.txt — ça bloquait donc aussi "/annonces/nouvelle-*",
        // c'est-à-dire TOUTE annonce dont le slug généré à partir du titre
        // commence par "nouvelle" (mot très courant dans ce contexte : "nouvelle
        // fille", "nouvelle arrivée"...). Le "$" ancre la règle sur la page de
        // création exacte uniquement.
        disallow: ["/profil", "/annonces/nouvelle$", "/annonces/*/modifier", "/connexion", "/inscription", "/mot-de-passe-oublie", "/paiement/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
