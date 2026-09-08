"use client";

import { useState, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import CategoryPills from "@/components/CategoryPills";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import CityPills from "@/components/CityPills";
import AdCard from "@/components/AdCard";
import FilterDrawer from "@/components/FilterDrawer";
import { INITIAL_ADS } from "@/lib/mockData";
import { Ad } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HomePage() {
  const [ads] = useState<Ad[]>(INITIAL_ADS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Nombre d'annonces par catégorie, calculé depuis les annonces réellement
  // en ligne (jamais de compteurs figés dans le composant d'affichage).
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ads.length };
    for (const ad of ads) {
      counts[ad.category] = (counts[ad.category] || 0) + 1;
    }
    return counts;
  }, [ads]);

  // Villes triées par nombre d'annonces décroissant ; CityPills n'en affiche
  // que les 5 premières ("les 5 villes avec le plus d'annonces").
  const cityCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ad of ads) {
      counts.set(ad.city, (counts.get(ad.city) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [ads]);

  // Filtrage ultra-rapide
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      if (selectedCategory !== "all" && ad.category !== selectedCategory) return false;
      if (selectedCity && !ad.city.toLowerCase().includes(selectedCity.toLowerCase())) return false;
      if (selectedClient && ad.accepted_clients !== "TOUS" && ad.accepted_clients !== selectedClient) return false;
      if (vipOnly && ad.formula !== "VIP") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          ad.title.toLowerCase().includes(q) ||
          ad.description.toLowerCase().includes(q) ||
          ad.city.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [ads, searchQuery, selectedCategory, selectedCity, selectedClient, vipOnly]);

  const hasActiveFilters = Boolean(
    selectedCategory !== "all" || selectedCity || selectedClient || vipOnly
  );

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedCity("");
    setSelectedClient("");
    setVipOnly(false);
    setSearchQuery("");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* 1. TITRE & RECHERCHE (CONFORME CAPTURE 3) */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenFilters={() => setIsFilterOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 2. CATÉGORIES AVEC BULLES ET BADGES ROUGES (CONFORME CAPTURE 3) */}
      <CategoryPills
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        counts={categoryCounts}
      />

      {/* 3. VOS ANNONCES ÉTOILES (CONFORME CAPTURE 3) */}
      <FeaturedCarousel ads={ads} />

      {/* 4. VILLES POPULAIRES (CONFORME CAPTURE 2 & 3) */}
      <CityPills
        cities={cityCounts}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
      />

      {/* 5. LISTE DES CARTES D'ANNONCES (CONFORME CAPTURES 1, 2 ET 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pt-2 justify-items-center sm:justify-items-stretch">
        {filteredAds.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>

      {/* 6. BOUTON "AFFICHER PLUS D'ANNONCES >>>" (CONFORME CAPTURE 1) */}
      <div className="pt-2">
        <button
          onClick={() => setCurrentPage((p) => p + 1)}
          className="w-full py-3.5 px-4 rounded-2xl bg-white border-2 border-[#16A34A] text-[#16A34A] hover:bg-emerald-50 text-sm font-extrabold shadow-sm transition-all"
        >
          Afficher plus d'annonces &gt;&gt;&gt;
        </button>
      </div>

      {/* 7. PAGINATION EXACTE NUMÉROTÉE (CONFORME CAPTURE 4) */}
      <div className="flex items-center justify-center gap-1.5 py-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="w-9 h-9 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button className="w-9 h-9 rounded-xl bg-[#991B1B] text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
          1
        </button>

        <button className="w-9 h-9 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-700 flex items-center justify-center hover:bg-slate-50">
          2
        </button>

        <span className="px-1 text-slate-400 font-bold">...</span>

        <button className="w-9 h-9 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-700 flex items-center justify-center hover:bg-slate-50">
          32
        </button>

        <button
          onClick={() => setCurrentPage((p) => p + 1)}
          className="w-9 h-9 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* TIROIR DE FILTRES */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        vipOnly={vipOnly}
        setVipOnly={setVipOnly}
        onReset={resetFilters}
      />
    </div>
  );
}
