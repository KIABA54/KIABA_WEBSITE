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

export default function CityPills({ selectedCity, onSelectCity }: CityPillsProps) {
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-extrabold text-brand-blue-900">
          Villes populaires
        </h2>
        <button
          onClick={() => onSelectCity("")}
          className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2 min-h-11 px-1"
        >
          <span>Voir toutes les villes</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <div
        role="list"
        className="flex items-center gap-2 md:gap-3 overflow-x-auto md:overflow-visible md:flex-wrap pb-2 scrollbar-none scroll-fade-x md:scroll-fade-none"
      >
        {CITIES.map((item) => {
          const isSelected = selectedCity.toLowerCase() === item.name.toLowerCase();

          return (
            <button
              key={item.name}
              role="listitem"
              aria-pressed={isSelected}
              onClick={() => onSelectCity(isSelected ? "" : item.name)}
              className="flex flex-col items-center gap-1.5 flex-1 md:flex-none min-w-[62px] md:w-20 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
            >
              <div className="relative">
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-3xs font-black bg-red-800 text-white shadow-sm whitespace-nowrap z-10">
                  {item.count}
                </span>

                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all mt-1 ${
                    isSelected
                      ? "bg-rose-50 border-rose-500 shadow-card scale-105"
                      : "bg-white border-slate-200 group-hover:border-slate-300 shadow-sm"
                  }`}
                >
                  <MapPin className="w-5 h-5 text-red-600" aria-hidden="true" />
                </div>
              </div>

              <span className="text-2xs font-bold text-slate-800 truncate max-w-[70px]">
                {item.label || item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
