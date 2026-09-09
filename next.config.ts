import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `next/image` n'est pas utilisé actuellement dans le projet (tout passe
  // par des <img> bruts), donc ce réglage est dormant pour l'instant — mais
  // `hostname: "**"` (n'importe quel domaine) est un vrai risque de SSRF
  // via l'optimiseur d'image le jour où next/image serait introduit sans
  // qu'on pense à revenir corriger ce fichier avant. Limité aux hôtes
  // réellement utilisés pour des images dans ce projet.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
