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
      <h2 className="text-sm sm:text-base font-extrabold text-[#1E3A8A]">
        Catégories
      </h2>

      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORY_ITEMS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="flex flex-col items-center gap-1.5 flex-1 min-w-[62px] group focus:outline-none"
            >
              <div className="relative">
                {/* Badge compteur rouge foncé superposé en haut du cercle */}
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#991B1B] text-white shadow-sm whitespace-nowrap z-10">
                  {cat.count}
                </span>

                {/* Cercle avec bordure douce */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-200 mt-1 ${
                    isSelected
                      ? "bg-rose-50 border-brand-pink-500 text-brand-pink-600 shadow-md scale-105"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[1.8]" />
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
