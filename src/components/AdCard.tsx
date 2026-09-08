"use client";

import Link from "next/link";
import { User, Gem, MapPin, Zap, ShieldCheck, Clock, MessageCircle, Phone } from "lucide-react";
import { Ad } from "@/lib/types";

interface AdCardProps {
  ad: Ad;
}

export default function AdCard({ ad }: AdCardProps) {
  const getRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `il y a : ${Math.max(1, diffMin)} minutes`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a : ${diffH} heures`;
    const diffD = Math.floor(diffH / 24);
    return `il y a : ${diffD} jours`;
  };

  const cleanPhone = ad.phone_number.replace(/\s+/g, "");
  const isVip = ad.formula === "VIP";
  const isProPlus = ad.formula === "PRO_PLUS";

  return (
    <div className="bg-[#FFF8F6] rounded-2xl p-3 border-2 border-rose-300 shadow-sm transition-all hover:border-brand-pink-400 space-y-2">
      <div className="flex gap-3">
        {/* VIGNETTE PHOTO GAUCHE (Avec badge VIP en haut à gauche comme sur la capture) */}
        <Link
          href={`/annonces/${ad.id}`}
          className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 block"
        >
          <img
            src={ad.photos[0]}
            alt={ad.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* BADGE VIP VERT / ROSE EN HAUT À GAUCHE (CONFORME AUX CAPTURES MOOSSO) */}
          <div className="absolute top-1.5 left-1.5">
            {isVip ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#22C55E] text-white shadow-sm">
                VIP
              </span>
            ) : isProPlus ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-brand-pink-500 text-white shadow-sm">
                PRO+
              </span>
            ) : ad.formula === "PRO" ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-brand-blue-800 text-white shadow-sm">
                PRO
              </span>
            ) : null}
          </div>
        </Link>

        {/* COLONNE DROITE INFORMATIONS (REPRODUCTION EXACTE DU TEXTE DES CAPTURES) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            {/* Titre en gras sur 2 lignes */}
            <Link href={`/annonces/${ad.id}`}>
              <h3 className="text-xs sm:text-sm font-extrabold text-[#1E3A8A] line-clamp-2 leading-tight hover:text-brand-pink-600 transition-colors mb-1.5">
                {ad.title}
              </h3>
            </Link>

            {/* Publié par Sexe_gamine (en bleu) */}
            <div className="flex items-center gap-1 text-[11px] text-slate-600 mb-1">
              <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="truncate">
                Publié par <strong className="text-[#1E40AF] font-extrabold">{ad.user?.username || "Sexe_gamine"}</strong>
              </span>
            </div>

            {/* Rencontres - escortes (avec diamant bleu) */}
            <div className="flex items-center gap-1 text-[11px] text-slate-600 mb-1">
              <Gem className="w-3.5 h-3.5 text-[#38BDF8] flex-shrink-0" />
              <span className="truncate font-medium capitalize">
                {ad.category === "escorte-girl" ? "Rencontres - escortes" : ad.category.replace("-", " ")}
              </span>
            </div>

            {/* Localisation : Abidjan ⚡ Bingerville */}
            <div className="flex items-center gap-1 text-[11px] text-slate-600 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="font-semibold text-slate-800 truncate">
                {ad.city}
              </span>
              <span className="text-amber-500 font-bold flex items-center gap-0.5">
                ⚡ {ad.address || "Centre"}
              </span>
            </div>

            {/* BADGES : CERTIFIÉ (vert) & URGENT (rouge) */}
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-[#16A34A]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>CERTIFIÉ</span>
              </span>

              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#DC2626] text-white shadow-sm">
                URGENT
              </span>
            </div>
          </div>

          {/* LIGNE DU BAS : FORMULE / STATUT & TEMPS RELATIF */}
          <div className="pt-1 flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-[#2563EB]">
              {isVip ? "Platinum" : isProPlus ? "Gold" : "Bronze"}
            </span>

            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{getRelativeTime(ad.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RANGÉE DE CONTACT RAPIDE WHATSAPP & APPEL */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rose-200/60">
        <a
          href={`https://wa.me/${cleanPhone}?text=Bonjour%20vu%20sur%20KIABA%20RENCONTRE`}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-3 rounded-xl bg-[#22C55E] hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-current" />
          <span>WhatsApp</span>
        </a>

        <a
          href={`tel:${cleanPhone}`}
          className="py-1.5 px-3 rounded-xl bg-[#1E40AF] hover:bg-blue-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Phone className="w-3.5 h-3.5 fill-current" />
          <span>Appeler</span>
        </a>
      </div>
    </div>
  );
}
