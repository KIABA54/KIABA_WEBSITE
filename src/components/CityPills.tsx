"use client";

import { MapPin, ArrowRight } from "lucide-react";

interface CityPillsProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
}

const CITIES = [
  { name: "Abidjan", count: 528 },
  { name: "Bouaké", count: 32 },
  { name: "Korhogo", count: 23 },
  { name: "Yamoussoukro", label: "Yamousso...", count: 6 },
  { name: "San-Pédro", count: 5 },
];

export default function CityPills({
  selectedCity,
  onSelectCity,
}: CityPillsProps) {
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-extrabold text-[#1E3A8A]">
          Villes populaires
        </h2>
        <button
          onClick={() => onSelectCity("")}
          className="text-xs font-bold text-[#DC2626] hover:underline flex items-center gap-1"
        >
          <span>Voir toutes les villes</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CITIES.map((item) => {
          const isSelected = selectedCity.toLowerCase() === item.name.toLowerCase();

          return (
            <button
              key={item.name}
              onClick={() => onSelectCity(isSelected ? "" : item.name)}
              className="flex flex-col items-center gap-1.5 flex-1 min-w-[60px] group focus:outline-none"
            >
              <div className="relative">
                {/* Badge compteur rouge superposé au centre supérieur du cercle */}
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#991B1B] text-white shadow-sm whitespace-nowrap z-10">
                  {item.count}
                </span>

                {/* Cercle avec icône pin rouge */}
                <div
                  className={`w-13 h-13 rounded-full flex items-center justify-center border-2 transition-all mt-1 ${
                    isSelected
                      ? "bg-rose-50 border-rose-500 shadow-md scale-105"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <MapPin className="w-5 h-5 text-[#DC2626]" />
                </div>
              </div>

              <span className="text-[11px] font-bold text-slate-800 truncate max-w-[65px]">
                {item.label || item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
