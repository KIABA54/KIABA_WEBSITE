"use client";

import { MapPin, ArrowRight } from "lucide-react";

export interface CityCount {
  name: string;
  count: number;
}

interface CityPillsProps {
  /** Villes déjà triées par nombre d'annonces (ordre décroissant) ; seules les 5 premières sont affichées. */
  cities: CityCount[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onViewAllCities?: () => void;
}

const MAX_VISIBLE_CITIES = 5;

export default function CityPills({ cities, selectedCity, onSelectCity, onViewAllCities }: CityPillsProps) {
  const topCities = cities.slice(0, MAX_VISIBLE_CITIES);

  if (topCities.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-extrabold text-brand-blue-900">
          Villes populaires
        </h2>
        <button
          onClick={() => (onViewAllCities ? onViewAllCities() : onSelectCity(""))}
          className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2 min-h-11 px-1"
        >
          <span>Voir toutes les villes</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <div
        role="list"
        className="flex items-center gap-2 md:gap-3 overflow-x-auto md:overflow-visible md:flex-wrap md:justify-center pt-3 pb-2 -mt-3 scrollbar-none scroll-fade-x md:scroll-fade-none"
      >
        {topCities.map((item) => {
          const isSelected = selectedCity.toLowerCase() === item.name.toLowerCase();

          return (
            <button
              key={item.name}
              role="listitem"
              aria-pressed={isSelected}
              onClick={() => onSelectCity(isSelected ? "" : item.name)}
              className="flex flex-col items-center gap-1.5 flex-1 md:flex-none min-w-[62px] md:w-24 group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink-500 focus-visible:ring-offset-2"
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

              <span className="text-2xs font-bold text-slate-800 truncate max-w-[80px]">
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
