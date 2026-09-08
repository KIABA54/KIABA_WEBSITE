"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { ShieldCheck, CheckCircle2, Phone, CreditCard, Lock } from "lucide-react";

function PaymentSimulationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const amount = searchParams.get("amount") || "3400";
  const ref = searchParams.get("ref") || `MTX-${Date.now()}`;
  const [selectedMethod, setSelectedMethod] = useState("wave");
  const [phone, setPhone] = useState("+225 07 00 00 00 00");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      router.push(`/paiement/succes?ref=${ref}&amount=${amount}&method=${selectedMethod}`);
    }, 1200);
  };

  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      {/* HEADER PAIEMENT */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Paiement Sécurisé</span>
        </div>
        <h1 className="text-xl font-black text-slate-900">
          Règlement KIABA RENCONTRE
        </h1>
        <p className="text-xs text-slate-500">
          Réf: <span className="font-mono font-bold text-slate-700">{ref}</span>
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-5">
        {/* MONTANT À PAYER */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Montant total à régler
          </span>
          <p className="text-2xl font-black text-brand-pink-600 mt-1">
            {Number(amount).toLocaleString()} FCFA
          </p>
        </div>

        {/* CHOIX DU FOURNISSEUR MOBILE MONEY / CARTE */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Choisissez votre moyen de paiement :
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: "wave", name: "Wave Mobile Money", badge: "0% frais" },
              { id: "orange_money", name: "Orange Money", badge: "CI / UEMOA" },
              { id: "mtn_money", name: "MTN MoMo", badge: "Instantané" },
              { id: "moov_money", name: "Moov Money", badge: "CI / UEMOA" },
              { id: "card", name: "Carte Visa / Mastercard", badge: "International" },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                  selectedMethod === method.id
                    ? "border-brand-pink-500 bg-brand-pink-50/40 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{method.name}</span>
                  {selectedMethod === method.id && (
                    <CheckCircle2 className="w-4 h-4 text-brand-pink-500" />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{method.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* NUMÉRO DE TÉLÉPHONE DÉBITE */}
        {selectedMethod !== "card" ? (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Numéro de compte {selectedMethod.replace("_", " ").toUpperCase()} :
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-brand-pink-500"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Informations carte bancaire :
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="4000 1234 5678 9010"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-brand-pink-500"
              />
            </div>
          </div>
        )}

        {/* BOUTON DE CONFIRMATION */}
        <button
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <span>Traitement en cours...</span>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Confirmer et Payer {Number(amount).toLocaleString()} FCFA</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-400 text-center">
          Transaction chiffrée SSL 256-bit
        </p>
      </div>
    </div>
  );
}

export default function PaymentSimulationPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-slate-500">Chargement de la page de paiement sécurisée...</div>}>
      <PaymentSimulationContent />
    </Suspense>
  );
}
