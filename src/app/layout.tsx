import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AgeVerificationModal from "@/components/AgeVerificationModal";

export const metadata: Metadata = {
  title: "KIABA RENCONTRE — Petites Annonces Adultes",
  description: "Plateforme de petites annonces pour adultes rapide, discrète et sécurisée.",
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
