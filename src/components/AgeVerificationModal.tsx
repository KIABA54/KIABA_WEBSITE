"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

export default function AgeVerificationModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasConfirmed = localStorage.getItem("kiaba_age_verified");
    if (!hasConfirmed) {
      setIsOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem("kiaba_age_verified", "true");
    setIsOpen(false);
  };

  const handleDecline = () => {
    window.location.href = "https://www.google.com";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-brand-pink-500/30 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-pink-100 flex items-center justify-center text-brand-pink-600">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-700 rounded-full mb-3">
          Contenu Strictement Réservé aux Adultes (+18)
        </span>

        <h2 className="text-xl font-extrabold text-slate-900 mb-2">
          Avertissement Légal
        </h2>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Le site <strong className="text-slate-900">KIABA RENCONTRE</strong> propose des petites annonces et services destinés exclusivement à un public majeur. L'accès aux mineurs est formellement interdit.
          <br /><br />
          Certifiez-vous avoir <strong>au moins 18 ans</strong> révolus selon les lois de votre pays de résidence ?
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 hover:from-brand-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            J'ai 18 ans ou plus - Entrer
          </button>
          <button
            onClick={handleDecline}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
          >
            Quitter le site
          </button>
        </div>
      </div>
    </div>
  );
}
