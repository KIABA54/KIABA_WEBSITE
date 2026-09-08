"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenFilters: () => void;
  hasActiveFilters?: boolean;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  onOpenFilters,
  hasActiveFilters = false,
}: SearchBarProps) {
  return (
    <div className="w-full space-y-3">
      {/* TITRE PRINCIPAL EXACT DE LA CAPTURE 3 */}
      <h1 className="text-center text-lg sm:text-xl font-black text-[#1E3A8A] tracking-tight">
        Trouvez des annonces<br />près de chez vous
      </h1>

      {/* BARRE DE RECHERCHE + BOUTON FILTRES */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une annonce"
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-pink-500 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* BOUTON FILTRES EXACT DE LA CAPTURE 3 */}
        <button
          onClick={onOpenFilters}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold shadow-sm transition-all ${
            hasActiveFilters
              ? "bg-[#1E3A8A] border-[#1E3A8A] text-white"
              : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filtres</span>
        </button>
      </div>
    </div>
  );
}
