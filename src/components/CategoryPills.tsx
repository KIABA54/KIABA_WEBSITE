"use client";

import { LayoutGrid, Heart, Sparkles, ShoppingBag, Clock } from "lucide-react";

interface CategoryPillsProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

const CATEGORY_ITEMS = [
  { id: "all", label: "Toutes", count: 632, icon: LayoutGrid },
  { id: "escorte-girl", label: "Rencontres", count: 459, icon: Heart },
  { id: "massage", label: "Massages", count: 25, icon: Sparkles },
  { id: "produits", label: "Produits", count: 148, icon: ShoppingBag },
  { id: "recentes", label: "Récentes", count: 632, icon: Clock },
];

export default function CategoryPills({
  selectedCategory,
  onSelectCategory,
}: CategoryPillsProps) {
  return (
    <div className="w-full space-y-2">
      <h2 className="text-sm sm:text-base font-extrabold text-brand-blue-900">Catégories</h2>

      <div
        role="list"
        className="flex items-center gap-2 md:gap-3 overflow-x-auto md:overflow-visible md:flex-wrap pb-2 scrollbar-none scroll-fade-x md:scroll-fade-none"
      >
        {CATEGORY_ITEMS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              role="listitem"
              aria-pressed={isSelected}
              onClick={() => onSelectCategory(cat.id)}
              className="flex flex-col items-center gap-1.5 flex-1 md:flex-none min-w-[64px] md:w-20 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
            >
              <div className="relative">
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-3xs font-black bg-red-800 text-white shadow-sm whitespace-nowrap z-10">
                  {cat.count}
                </span>

                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-200 mt-1 ${
                    isSelected
                      ? "bg-rose-50 border-brand-pink-500 text-brand-pink-600 shadow-card scale-105"
                      : "bg-white border-slate-200 text-slate-600 group-hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[1.8]" aria-hidden="true" />
                </div>
              </div>

              <span
                className={`text-xs font-bold whitespace-nowrap ${
                  isSelected ? "text-brand-pink-600" : "text-slate-700 group-hover:text-slate-900"
                }`}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
