"use client";

import { X, Check } from "lucide-react";
import { CATEGORIES, CLIENT_TYPES } from "@/lib/constants";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-base font-extrabold text-slate-900">
            Filtres de recherche
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 flex-1">
          {/* VIP ONLY SWITCH */}
          <div className="p-3.5 rounded-xl bg-brand-pink-50 border border-brand-pink-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Annonces VIP uniquement</p>
              <p className="text-xs text-slate-500">Voir en priorité les profils premium vérifiés</p>
            </div>
            <button
              onClick={() => setVipOnly(!vipOnly)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                vipOnly ? "bg-brand-pink-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  vipOnly ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* VILLE (CHAMP LIBRE) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Ville
            </label>
            <input
              type="text"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              placeholder="Ex: Abidjan, Bouaké, Cocody..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20"
            />
          </div>

          {/* CATEGORIES */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Catégorie de service
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
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
                  onClick={() => setSelectedCategory(c.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                    selectedCategory === c.id
                      ? "bg-brand-pink-500 text-white border-brand-pink-500"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* TYPE DE CLIENTELE ACCEPTEE */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Clientèle acceptée
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedClient("")}
                className={`p-2 rounded-lg border text-xs font-semibold ${
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
                  onClick={() => setSelectedClient(cl.id)}
                  className={`p-2 rounded-lg border text-xs font-semibold ${
                    selectedClient === cl.id
                      ? "bg-brand-blue-800 text-white border-brand-blue-800"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {cl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center gap-3 bg-white sticky bottom-0">
          <button
            onClick={onReset}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Réinitialiser
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 text-white font-bold text-xs shadow-md hover:from-brand-pink-600 hover:to-rose-700 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Appliquer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
