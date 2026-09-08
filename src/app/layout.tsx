import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import { SITE_FAVICON_URL, SITE_OG_IMAGE_URL } from "@/lib/constants";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.ci-kiaba.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KIABA RENCONTRE — Petites Annonces Adultes en Côte d'Ivoire",
    // Permet à chaque page de définir juste son propre segment de titre
    // (ex: generateMetadata sur une annonce) sans répéter le nom du site.
    template: "%s | KIABA RENCONTRE",
  },
  description: "Plateforme de petites annonces pour adultes rapide, discrète et sécurisée.",
  icons: {
    icon: SITE_FAVICON_URL,
    apple: SITE_FAVICON_URL,
  },
  openGraph: {
    siteName: "KIABA RENCONTRE",
    locale: "fr_CI",
    type: "website",
    // Image par défaut pour tout partage de lien — les pages qui ont leur
    // propre visuel plus pertinent (ex: une annonce et sa photo) écrasent
    // ce champ dans leur propre generateMetadata().
    images: [{ url: SITE_OG_IMAGE_URL }],
  },
  twitter: {
    card: "summary_large_image",
    images: [SITE_OG_IMAGE_URL],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Le pinch-to-zoom reste actif (accessibilité) : on ne fige que l'échelle initiale.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900">
        {/* Modale de majorité 18+ */}
        <AgeVerificationModal />

        <Header />

        {/* Contenu principal : pleine largeur confortable en mobile, colonne centrée et
            élargie progressivement en tablette/desktop (les pages définissent elles-mêmes
            une largeur plus étroite si leur contenu le justifie, ex: formulaires). */}
        <main className="flex-1 w-full mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
