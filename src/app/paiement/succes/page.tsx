"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2, FileText, ArrowRight, Home, Sparkles } from "lucide-react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || `TXN-${Date.now()}`;
  const amount = searchParams.get("amount") || "0";
  const type = searchParams.get("type") || "paid";

  const isFree = type === "free" || amount === "0";

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 tracking-wider">
            {isFree ? "Offre de Bienvenue Validée" : "Paiement Confirmé"}
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-2">
            Votre annonce est en ligne !
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Elle est immédiatement visible par l'ensemble des visiteurs sur KIABA RENCONTRE.
          </p>
        </div>

        {/* FACTURETTE / REÇU OFFICIEL */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b pb-2 font-bold text-slate-900">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4 text-brand-pink-500" />
              <span>Reçu de transaction</span>
            </span>
            <span className="text-[11px] text-slate-500">
              {new Date().toLocaleDateString("fr-FR")}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Référence :</span>
            <span className="font-mono font-bold text-slate-800">{ref}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Plateforme de paiement :</span>
            <span className="font-bold text-slate-800">
              {isFree ? "Gratuité Standard Nouveau Compte" : "GeniusPay (Mobile Money / Carte)"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Statut :</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <span>Payé avec succès</span>
            </span>
          </div>

          <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm">
            <span>Montant réglé :</span>
            <span className="text-brand-pink-600">
              {isFree ? "0 FCFA (Offert)" : `${Number(amount).toLocaleString()} FCFA`}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Un email récapitulatif contenant votre facturette officielle a été envoyé sur votre adresse email.
        </p>

        {/* ACTIONS */}
        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 hover:from-brand-pink-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Voir mon annonce sur l'accueil</span>
          </Link>

          <Link
            href="/profil"
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Accéder à mon tableau de bord</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-slate-500">Chargement de votre reçu...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
