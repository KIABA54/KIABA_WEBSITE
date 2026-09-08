"use client";

import { useEffect, useRef } from "react";
import { X, Check } from "lucide-react";
import { CATEGORIES, CITIES, CLIENT_TYPES } from "@/lib/constants";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedClient: string;
  setSelectedClient: (client: string) => void;
  vipOnly: boolean;
  setVipOnly: (vip: boolean) => void;
  onReset: () => void;
}

export default function FilterDrawer({
  isOpen,
  onClose,
  selectedCategory,
  setSelectedCategory,
  selectedCity,
  setSelectedCity,
  selectedClient,
  setSelectedClient,
  vipOnly,
  setVipOnly,
  onReset,
}: FilterDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Mobile : bottom sheet qui glisse depuis le bas. Desktop (sm+) : panneau latéral. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-white max-h-[88vh] sm:max-h-none sm:h-full rounded-t-3xl sm:rounded-t-none shadow-popover flex flex-col justify-between overflow-y-auto animate-slide-up sm:animate-slide-in-right"
      >
        {/* Poignée visuelle du bottom sheet (mobile uniquement) */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 sticky top-0 bg-white z-10">
          <span className="w-10 h-1.5 rounded-full bg-slate-200" aria-hidden="true" />
        </div>

        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 sm:top-0 bg-white z-10">
          <h2 id="filter-drawer-title" className="text-base font-extrabold text-slate-900">
            Filtres de recherche
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Fermer les filtres"
            className="p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 space-y-6 flex-1">
          {/* VIP ONLY SWITCH */}
          <div className="p-3.5 rounded-xl bg-brand-pink-50 border border-brand-pink-200 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Annonces VIP uniquement</p>
              <p className="text-xs text-slate-500">Voir en priorité les profils premium vérifiés</p>
            </div>
            <button
              role="switch"
              aria-checked={vipOnly}
              aria-label="Annonces VIP uniquement"
              onClick={() => setVipOnly(!vipOnly)}
              className={`w-12 h-7 rounded-full transition-colors relative p-0.5 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2 ${
                vipOnly ? "bg-brand-pink-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                  vipOnly ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* VILLE */}
          <div>
            <label htmlFor="filter-city" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Ville
            </label>
            <select
              id="filter-city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-11 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20 bg-white"
            >
              <option value="">Toutes les villes</option>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* CATEGORIES */}
          <fieldset>
            <legend className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Catégorie de service
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={selectedCategory === "all"}
                onClick={() => setSelectedCategory("all")}
                className={`p-2.5 min-h-11 rounded-xl border text-xs font-bold text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600 focus-visible:ring-offset-2 ${
                  selectedCategory === "all"
                    ? "bg-brand-blue-800 text-white border-brand-blue-800"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Toutes les catégories
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={selectedCategory === c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`p-2.5 min-h-11 rounded-xl border text-xs font-bold text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2 ${
                    selectedCategory === c.id
                      ? "bg-brand-pink-500 text-white border-brand-pink-500"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* TYPE DE CLIENTELE ACCEPTEE */}
          <fieldset>
            <legend className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Clientèle acceptée
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={!selectedClient}
                onClick={() => setSelectedClient("")}
                className={`p-2.5 min-h-11 rounded-lg border text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600 focus-visible:ring-offset-2 ${
                  !selectedClient
                    ? "bg-brand-blue-800 text-white border-brand-blue-800"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Tous
              </button>
              {CLIENT_TYPES.map((cl) => (
                <button
                  key={cl.id}
                  type="button"
                  aria-pressed={selectedClient === cl.id}
                  onClick={() => setSelectedClient(cl.id)}
                  className={`p-2.5 min-h-11 rounded-lg border text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600 focus-visible:ring-offset-2 ${
                    selectedClient === cl.id
                      ? "bg-brand-blue-800 text-white border-brand-blue-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {cl.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center gap-3 bg-white sticky bottom-0">
          <button
            onClick={onReset}
            className="flex-1 min-h-11 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600 focus-visible:ring-offset-2"
          >
            Réinitialiser
          </button>
          <button
            onClick={onClose}
            className="flex-1 min-h-11 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 text-white font-bold text-xs shadow-card hover:from-brand-pink-600 hover:to-rose-700 transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-600 focus-visible:ring-offset-2"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>Appliquer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
