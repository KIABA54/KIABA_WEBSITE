import Link from "next/link";
import { AlertTriangle, MapPin, ChevronRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-8 pt-4 pb-10 space-y-4">
      {/* BLOC : OÙ ÊTES-VOUS ? (REPRODUCTION STRICTE CAPTURE 1) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-[#1E3A8A]">
              Où êtes-vous ?
            </p>
            <p className="text-xs text-slate-500 leading-snug">
              Choisissez votre ville pour voir en premier les annonces près de chez vous.
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
      </div>

      {/* AVERTISSEMENT DE SÉCURITÉ (REPRODUCTION STRICTE JAUNE/ORANGE CAPTURE 1) */}
      <div className="bg-[#FEFCE8] border border-[#FEF08A] rounded-2xl p-4 text-xs leading-relaxed flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-[#CA8A04] flex-shrink-0 mt-0.5 fill-[#FEF08A]" />
        <div>
          <p className="font-extrabold uppercase tracking-wide text-[#854D0E] mb-1">
            AVERTISSEMENT DE SÉCURITÉ
          </p>
          <p className="text-[#713F12]">
            Le contenu de ce site est généré par les utilisateurs. L'utilisateur est le seul responsable des produits et services proposés. En accédant au site, vous acceptez nos{" "}
            <Link href="/conditions" className="underline font-bold text-[#854D0E]">
              conditions générales
            </Link>
            .
          </p>
        </div>
      </div>

      {/* LIENS ET COPYRIGHT (REPRODUCTION STRICTE CAPTURES 1 ET 4) */}
      <div className="text-center space-y-2 pt-2">
        <div className="flex items-center justify-center gap-3 text-xs font-semibold text-slate-600">
          <Link href="/contact" className="hover:text-brand-pink-600">
            Contactez-nous
          </Link>
          <span>•</span>
          <Link href="/conditions" className="hover:text-brand-pink-600">
            Conditions
          </Link>
          <span>•</span>
          <Link href="/a-propos" className="hover:text-brand-pink-600">
            À propos
          </Link>
        </div>

        <p className="text-xs text-slate-500">
          © 2026 Kiaba Rencontre — Tous droits réservés
        </p>
      </div>
    </footer>
  );
}
