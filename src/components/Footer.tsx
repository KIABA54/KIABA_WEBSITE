"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, Heart, MapPin, ChevronRight } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();

  // Sur l'accueil, on scrolle directement (le hash seul ne re-déclenche pas
  // le scroll natif du navigateur une fois l'app hydratée). Depuis une
  // autre page, on navigue vers l'accueil avec le hash, qui gère le scroll
  // au premier rendu.
  const handleWhereAreYouClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      document.getElementById("villes-populaires")?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/#villes-populaires");
    }
  };

  return (
    <footer className="mt-8 border-t border-slate-200 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* OÙ ÊTES-VOUS ? : renvoie vers le sélecteur de ville de l'accueil
              (id="villes-populaires"), pas un lien mort. */}
          <Link
            href="/#villes-populaires"
            onClick={handleWhereAreYouClick}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-card hover:border-slate-300 hover:shadow-card-hover transition-all min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
          >
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-black text-brand-blue-900">Où êtes-vous ?</p>
                <p className="text-xs text-slate-500 leading-snug">
                  Choisissez votre ville pour voir en premier les annonces près de chez vous.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" aria-hidden="true" />
          </Link>

          {/* AVERTISSEMENT DE SÉCURITÉ */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs leading-relaxed flex items-start gap-3">
            <AlertTriangle
              className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5 fill-amber-200"
              aria-hidden="true"
            />
            <div>
              <p className="font-extrabold uppercase tracking-wide text-amber-900 mb-1">
                Avertissement de sécurité
              </p>
              <p className="text-amber-800">
                Le contenu de ce site est généré par les utilisateurs. L&apos;utilisateur est le
                seul responsable des produits et services proposés. En accédant au site, vous
                acceptez nos{" "}
                <Link
                  href="/conditions"
                  className="underline font-bold text-amber-900 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500"
                >
                  conditions générales
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* LIENS ET COPYRIGHT */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-slate-500">
            <Heart className="w-4 h-4 text-brand-pink-500" aria-hidden="true" />
            <span className="text-xs font-bold">Kiaba Rencontre</span>
          </Link>

          <nav
            aria-label="Liens du pied de page"
            className="flex items-center gap-3 sm:gap-5 text-xs font-semibold text-slate-600"
          >
            <Link
              href="/contact"
              className="hover:text-brand-pink-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 py-1"
            >
              Contactez-nous
            </Link>
            <Link
              href="/conditions"
              className="hover:text-brand-pink-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 py-1"
            >
              Conditions
            </Link>
            <Link
              href="/a-propos"
              className="hover:text-brand-pink-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 py-1"
            >
              À propos
            </Link>
          </nav>

          <p className="text-xs text-slate-400">© 2026 Kiaba Rencontre — Tous droits réservés</p>
        </div>
      </div>
    </footer>
  );
}
