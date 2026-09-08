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
      <h1 className="text-center text-lg sm:text-xl lg:text-2xl font-black text-brand-blue-900 tracking-tight">
        Trouvez des annonces
        <br className="sm:hidden" /> près de chez vous
      </h1>

      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="flex items-center gap-2 max-w-2xl mx-auto"
      >
        <div className="relative flex-1">
          <label htmlFor="site-search" className="sr-only">
            Rechercher une annonce
          </label>
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="site-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une annonce"
            className="w-full pl-10 pr-9 py-2.5 min-h-11 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20 shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenFilters}
          aria-haspopup="dialog"
          className={`flex items-center gap-1.5 px-4 min-h-11 rounded-xl border text-xs sm:text-sm font-bold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600 focus-visible:ring-offset-2 ${
            hasActiveFilters
              ? "bg-brand-blue-900 border-brand-blue-900 text-white"
              : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          <span>Filtres</span>
        </button>
      </form>
    </div>
  );
}
