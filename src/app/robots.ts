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
        disallow: ["/profil", "/annonces/nouvelle", "/annonces/*/modifier", "/connexion", "/inscription", "/mot-de-passe-oublie", "/paiement/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
