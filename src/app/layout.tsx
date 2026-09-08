import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AgeVerificationModal from "@/components/AgeVerificationModal";

export const metadata: Metadata = {
  title: "KIABA RENCONTRE — Petites Annonces Adultes",
  description: "Plateforme de petites annonces pour adultes rapide, discrète et sécurisée.",
};

// ANTI-ZOOM STRICT SUR TOUT LE SITE
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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

        {/* Header 2 étages exactement conforme aux captures */}
        <Header />

        {/* Contenu principal */}
        <main className="flex-1 max-w-lg w-full mx-auto px-3 sm:px-4 py-3">
          {children}
        </main>

        {/* Pied de page */}
        <Footer />
      </body>
    </html>
  );
}
