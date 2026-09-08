"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { XCircle, RefreshCw, Home } from "lucide-react";

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("reference") || searchParams.get("ref") || "—";

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
          <XCircle className="w-10 h-10" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 tracking-wider">
            Paiement Non Abouti
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-2">
            Le paiement n'a pas abouti
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aucun montant n'a été débité. Votre annonce n'a pas été publiée.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Référence :</span>
            <span className="font-mono font-bold text-slate-800">{ref}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Statut :</span>
            <span className="font-bold text-rose-600">Échec ou annulation</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Vous pouvez réessayer avec le même moyen de paiement ou en choisir un autre (Wave, Orange Money, MTN MoMo, Moov Money, carte bancaire).
        </p>

        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href="/annonces/nouvelle"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 hover:from-brand-pink-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer le paiement</span>
          </Link>

          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Retour à l'accueil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-slate-500">Chargement...</div>}>
      <PaymentFailureContent />
    </Suspense>
  );
}
