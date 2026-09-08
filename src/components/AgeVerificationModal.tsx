"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";

export default function AgeVerificationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const declineRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasConfirmed = localStorage.getItem("kiaba_age_verified");
    if (!hasConfirmed) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Cette porte d'entrée +18 ne doit pas pouvoir être contournée en silence : Échap agit
        // comme "Quitter le site" plutôt que de fermer la modale sans confirmation d'âge.
        e.preventDefault();
        handleDecline();
        return;
      }

      if (e.key === "Tab") {
        const focusables = [confirmRef.current, declineRef.current].filter(
          (el): el is HTMLButtonElement => Boolean(el)
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

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
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-description"
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-popover border-2 border-brand-pink-500/30 text-center animate-zoom-in"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-pink-100 flex items-center justify-center text-brand-pink-600">
          <ShieldAlert className="w-9 h-9" aria-hidden="true" />
        </div>

        <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-700 rounded-full mb-3">
          Contenu strictement réservé aux adultes (+18)
        </span>

        <h2 id="age-gate-title" className="text-xl font-extrabold text-slate-900 mb-2">
          Avertissement légal
        </h2>

        <p id="age-gate-description" className="text-sm text-slate-600 mb-6 leading-relaxed">
          Le site <strong className="text-slate-900">KIABA RENCONTRE</strong> propose des petites
          annonces et services destinés exclusivement à un public majeur. L&apos;accès aux
          mineurs est formellement interdit.
          <br />
          <br />
          Certifiez-vous avoir <strong>au moins 18 ans</strong> révolus selon les lois de votre
          pays de résidence ?
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            ref={confirmRef}
            onClick={handleConfirm}
            className="flex-1 min-h-11 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 hover:from-brand-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-card transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-600 focus-visible:ring-offset-2"
          >
            J&apos;ai 18 ans ou plus — Entrer
          </button>
          <button
            ref={declineRef}
            onClick={handleDecline}
            className="min-h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            Quitter le site
          </button>
        </div>
      </div>
    </div>
  );
}
