"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, FileText, Home, Sparkles, Loader2 } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  NEW_AD: "Publication d'annonce",
  BOOST: "Mise en avant (Boost)",
  RENEWAL: "Renouvellement d'annonce",
  EDIT: "Modification d'annonce",
};

// Libellés volontairement génériques : le nom du prestataire de paiement
// n'est pas mis en avant côté utilisateur.
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mobile_money: "Mobile Money",
  wave: "Wave",
  orange_money: "Orange Money",
  mtn_money: "MTN MoMo",
  moov_money: "Moov Money",
  card: "Carte bancaire",
};

interface TransactionInfo {
  type: string;
  amount_fcfa: number;
  payment_method: string | null;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();

  // Notre propre flux "1ère annonce gratuite" (voir /annonces/nouvelle) nous
  // redirige ici lui-même avec ces paramètres, qu'on peut faire confiance
  // directement puisqu'ils viennent de notre propre réponse API.
  const isFreeWelcome = searchParams.get("type") === "free";

  // GeniusPay, lui, redirige avec "reference"/"status" (pas "ref"/"amount") —
  // on ne fait jamais confiance à un montant venu de l'URL pour un paiement
  // réel : on va chercher la vraie transaction côté serveur.
  const reference = searchParams.get("reference") || searchParams.get("ref") || "";

  const [transaction, setTransaction] = useState<TransactionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(!isFreeWelcome && Boolean(reference));
  const [lookupFailed, setLookupFailed] = useState(false);

  useEffect(() => {
    if (isFreeWelcome || !reference) return;
    let cancelled = false;
    fetch(`/api/transactions/lookup?reference=${encodeURIComponent(reference)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setTransaction(data.transaction);
      })
      .catch(() => {
        if (!cancelled) setLookupFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isFreeWelcome, reference]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto py-16 flex flex-col items-center gap-2 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs">Confirmation du paiement en cours...</p>
      </div>
    );
  }

  const displayAmount = isFreeWelcome ? 0 : transaction?.amount_fcfa ?? null;
  const displayType = isFreeWelcome ? "Publication d'annonce" : TYPE_LABELS[transaction?.type || ""] || "Transaction";
  const displayMethod = isFreeWelcome
    ? "Gratuité Standard Nouveau Compte"
    : PAYMENT_METHOD_LABELS[transaction?.payment_method || ""] || "Paiement en ligne sécurisé";

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 tracking-wider">
            {isFreeWelcome ? "Offre de Bienvenue Validée" : "Paiement Confirmé"}
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-2">
            {displayType} réussie !
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {lookupFailed
              ? "Le paiement a été reçu ; les détails complets vous ont été envoyés par email."
              : "Elle est immédiatement visible par l'ensemble des visiteurs sur KIABA RENCONTRE."}
          </p>
        </div>

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

          {reference && (
            <div className="flex justify-between">
              <span className="text-slate-500">Référence :</span>
              <span className="font-mono font-bold text-slate-800 truncate max-w-[60%]">{reference}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-500">Plateforme de paiement :</span>
            <span className="font-bold text-slate-800">{displayMethod}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Statut :</span>
            <span className="font-bold text-emerald-600">Payé avec succès</span>
          </div>

          <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm">
            <span>Montant réglé :</span>
            <span className="text-brand-pink-600">
              {displayAmount === null
                ? "—"
                : displayAmount === 0
                ? "0 FCFA (Offert)"
                : `${displayAmount.toLocaleString()} FCFA`}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Un email récapitulatif contenant votre facturette officielle a été envoyé sur votre adresse email.
        </p>

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
