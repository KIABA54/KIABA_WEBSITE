import { Heart, ShieldCheck, Zap } from "lucide-react";

export const metadata = {
  title: "À propos — KIABA RENCONTRE",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="text-center">
        <h1 className="text-xl font-black text-slate-900">À propos de KIABA RENCONTRE</h1>
        <p className="text-xs text-slate-500 mt-1">
          Petites annonces pour adultes, en Côte d&apos;Ivoire.
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-600 leading-relaxed">
        <p>
          KIABA RENCONTRE est une plateforme de petites annonces pour adultes, pensée pour être
          rapide, discrète et sécurisée. Elle permet à des utilisateurs vérifiés de publier des
          annonces dans plusieurs catégories, et à tout visiteur de les consulter librement.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-brand-pink-50 border border-brand-pink-100 text-center">
            <Zap className="w-5 h-5 text-brand-pink-500 mx-auto mb-1.5" />
            <p className="font-bold text-slate-800">Rapide</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Publication en quelques minutes</p>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-center">
            <ShieldCheck className="w-5 h-5 text-brand-blue-800 mx-auto mb-1.5" />
            <p className="font-bold text-slate-800">Vérifié</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Comptes confirmés par email</p>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-center">
            <Heart className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
            <p className="font-bold text-slate-800">Discret</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Vos données restent les vôtres</p>
          </div>
        </div>

        <p className="pt-2">
          Toute annonce est soumise à un contrôle automatique avant mise en ligne, et l&apos;accès
          au site est strictement réservé aux personnes majeures. Retrouvez le détail de nos
          règles dans nos{" "}
          <a href="/conditions" className="text-brand-pink-600 font-bold hover:underline">
            conditions générales
          </a>
          .
        </p>
      </div>
    </div>
  );
}
