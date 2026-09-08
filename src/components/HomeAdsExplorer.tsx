"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SearchBar from "@/components/SearchBar";
import CategoryPills from "@/components/CategoryPills";
import AdCard, { AdCardSkeleton, AdListState } from "@/components/AdCard";
import FilterDrawer from "@/components/FilterDrawer";
import { Ad } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdsStats } from "@/lib/supabase/queries";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 12;

interface HomeAdsExplorerProps {
  initialAds: Ad[];
  initialTotal: number;
  initialStats: AdsStats;
}

export default function HomeAdsExplorer({ initialAds, initialTotal, initialStats }: HomeAdsExplorerProps) {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [pagination, setPagination] = useState<Pagination | null>({
    page: 1,
    limit: PAGE_SIZE,
    total: initialTotal,
    totalPages: Math.max(1, Math.ceil(initialTotal / PAGE_SIZE)),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [stats, setStats] = useState<AdsStats | null>(initialStats);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Le tout premier rendu correspond déjà exactement aux données fournies
  // par le serveur (page 1, aucun filtre) — on saute le premier fetch
  // client pour ne pas redemander ce qu'on a déjà reçu en SSR.
  const skipNextFetch = useRef(true);

  // Recherche débouncée : évite une requête à chaque frappe.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Retour à la page 1 dès qu'un filtre change.
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, selectedCity]);

  const loadAds = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(PAGE_SIZE));
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedCity) params.set("city", selectedCity);
      if (debouncedSearch) params.set("q", debouncedSearch);

      const res = await fetch(`/api/ads?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement.");

      setAds(data.ads || []);
      setPagination(data.pagination || null);
    } catch {
      setLoadError(true);
      setAds([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    loadAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedCategory, selectedCity, debouncedSearch]);

  // Filtres additionnels appliqués côté client sur la page courante — le
  // serveur ne filtre pas encore sur "clientèle acceptée" / "VIP uniquement".
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      if (vipOnly && ad.formula !== "VIP") return false;
      if (selectedClient && ad.accepted_clients !== "TOUS" && ad.accepted_clients !== selectedClient) return false;
      return true;
    });
  }, [ads, vipOnly, selectedClient]);

  const hasActiveFilters = Boolean(
    selectedCategory !== "all" || selectedCity || selectedClient || vipOnly
  );

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedCity("");
    setSelectedClient("");
    setVipOnly(false);
    setSearchInput("");
  };

  const categoryCounts = useMemo(() => {
    if (!stats) return undefined;
    return { all: stats.total, ...stats.byCategory };
  }, [stats]);

  const cityCounts = stats?.topCities || [];

  const totalPages = pagination?.totalPages || 0;

  // Numéros de page affichés : toujours 1 et la dernière, la page courante
  // avec ses voisines, "..." entre les deux si nécessaire.
  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [];
    const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    return Array.from(pages)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  }, [totalPages, currentPage]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <SearchBar
        searchQuery={searchInput}
        setSearchQuery={setSearchInput}
        onOpenFilters={() => setIsFilterOpen(true)}
        hasActiveFilters={hasActiveFilters}
        cities={cityCounts}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
      />

      <CategoryPills
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        counts={categoryCounts}
      />

      {/* LISTE DES ANNONCES */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pt-2 justify-items-center sm:justify-items-stretch">
          {Array.from({ length: 6 }).map((_, i) => (
            <AdCardSkeleton key={i} />
          ))}
        </div>
      ) : loadError ? (
        <AdListState variant="error" onRetry={loadAds} />
      ) : filteredAds.length === 0 ? (
        <AdListState variant="empty" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pt-2 justify-items-center sm:justify-items-stretch">
          {filteredAds.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      )}

      {/* PAGINATION RÉELLE */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Page précédente"
            className="w-9 h-9 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageNumbers.map((p, idx) => {
            const prev = pageNumbers[idx - 1];
            const showEllipsis = prev !== undefined && p - prev > 1;
            return (
              <span key={p} className="flex items-center gap-1.5">
                {showEllipsis && <span className="px-1 text-slate-400 font-bold">...</span>}
                <button
                  onClick={() => setCurrentPage(p)}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={`w-9 h-9 rounded-xl font-extrabold text-sm flex items-center justify-center shadow-sm transition-colors ${
                    p === currentPage
                      ? "bg-[#991B1B] text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              </span>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Page suivante"
            className="w-9 h-9 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

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
