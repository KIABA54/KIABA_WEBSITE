"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES, CLIENT_TYPES, CONTACT_CHANNELS, FORMULAS } from "@/lib/constants";
import { validateAdContent } from "@/lib/moderation";
import {
  Camera,
  Upload,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function NewAdPage() {
  const router = useRouter();

  // État du formulaire
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+225 ");
  const [contactChannel, setContactChannel] = useState<"WHATSAPP" | "CALL" | "BOTH">("BOTH");
  const [acceptedClient, setAcceptedClient] = useState<"HOMME" | "FEMME" | "TRANSGENRE" | "TOUS">("HOMME");

  // Catégorie & sous-catégories
  const [selectedCategory, setSelectedCategory] = useState<string>("escorte-girl");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(["Vaginal"]);

  // Photos (1 à 5 photos)
  const [photos, setPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
  ]);

  // Formule choisie
  const [selectedFormula, setSelectedFormula] = useState<"STANDARD" | "PRO" | "PRO_PLUS" | "VIP">("STANDARD");

  // Simulation compte nouveau inscrit : 1ère annonce Standard gratuite
  const [isFirstAdFree, setIsFirstAdFree] = useState(true);

  // État d'erreur et de soumission
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gestion des sous-catégories
  const activeCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  const handleToggleSubcategory = (sub: string) => {
    if (selectedSubcategories.includes(sub)) {
      if (selectedSubcategories.length === 1) return; // Garder au moins 1
      setSelectedSubcategories(selectedSubcategories.filter((s) => s !== sub));
    } else {
      setSelectedSubcategories([...selectedSubcategories, sub]);
    }
  };

  const handleCategoryChange = (newCat: string) => {
    setSelectedCategory(newCat);
    const cat = CATEGORIES.find((c) => c.id === newCat);
    if (cat && cat.subcategories.length > 0) {
      setSelectedSubcategories([cat.subcategories[0]]);
    }
  };

  // Ajout de photo (simulation d'upload instantané)
  const handleAddPhoto = () => {
    if (photos.length >= 5) {
      setErrorMsg("Vous ne pouvez ajouter que 5 photos maximum par annonce.");
      return;
    }
    const sampleUrls = [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
    ];
    const randomUrl = sampleUrls[photos.length % sampleUrls.length];
    setPhotos([...photos, randomUrl]);
    setErrorMsg("");
  };

  const handleRemovePhoto = (idx: number) => {
    if (photos.length <= 1) {
      setErrorMsg("Au moins 1 photo est obligatoire pour publier votre annonce.");
      return;
    }
    setPhotos(photos.filter((_, i) => i !== idx));
    setErrorMsg("");
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validations obligatoires
    if (!title.trim() || title.length < 10) {
      setErrorMsg("Le titre doit comporter au moins 10 caractères.");
      return;
    }
    if (!description.trim() || description.length < 20) {
      setErrorMsg("La description doit comporter au moins 20 caractères.");
      return;
    }
    if (!city.trim()) {
      setErrorMsg("Veuillez renseigner votre ville.");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Veuillez renseigner l'adresse ou le quartier du service.");
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      setErrorMsg("Veuillez renseigner un numéro de téléphone valide.");
      return;
    }
    if (photos.length === 0) {
      setErrorMsg("Au moins 1 photo est obligatoire.");
      return;
    }

    // Filtre automatique de modération (anti-haine, anti-racisme, sécurité)
    const moderation = validateAdContent(title, description);
    if (!moderation.isValid) {
      setErrorMsg(moderation.reason || "Contenu rejeté par le filtre de sécurité.");
      return;
    }

    setIsSubmitting(true);

    const isFree = selectedFormula === "STANDARD" && isFirstAdFree;

    if (isFree) {
      // Publication GRATUITE instantanée !
      setTimeout(() => {
        setIsSubmitting(false);
        router.push("/paiement/succes?ref=FREE-WELCOME&type=free");
      }, 1000);
    } else {
      // Paiement GeniusPay requis
      const amount = FORMULAS[selectedFormula].price;
      try {
        const res = await fetch("/api/payments/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            formula: selectedFormula,
            title,
            phone: phoneNumber,
            action_type: "NEW_AD",
          }),
        });
        const data = await res.json();
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          router.push(`/paiement/simulation?amount=${amount}&ref=TXN-${Date.now()}`);
        }
      } catch {
        router.push(`/paiement/simulation?amount=${amount}&ref=TXN-${Date.now()}`);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* HEADER DU FORMULAIRE */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-pink-50 text-brand-pink-600 border border-brand-pink-200 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Nouvelle Publication</span>
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          Déposez votre petite annonce
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Votre profil et vos coordonnées seront directement visibles par des milliers de visiteurs.
        </p>
      </div>

      {/* MESSAGE D'ERREUR SI PRESENT */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1 : PHOTOS (1 À 5 PHOTOS) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-brand-pink-500" />
              <span>Photos de l'annonce</span>
              <span className="text-rose-500">*</span>
            </h2>
            <span className="text-xs font-bold text-slate-500">
              {photos.length} / 5 photos (1 obligatoire)
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
            {photos.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-xl overflow-hidden border-2 border-brand-pink-200 group bg-slate-100"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-black/70 text-white">
                    Principale
                  </span>
                )}
              </div>
            ))}

            {photos.length < 5 && (
              <button
                type="button"
                onClick={handleAddPhoto}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-pink-400 hover:bg-brand-pink-50/50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-brand-pink-600 transition-all"
              >
                <Upload className="w-5 h-5" />
                <span className="text-[10px] font-bold">+ Ajouter</span>
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Format JPEG, PNG ou WEBP. Compression automatique ultra-rapide côté serveur.
          </p>
        </div>

        {/* SECTION 2 : INFORMATIONS PRINCIPALES */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Détails de l'annonce
          </h2>

          {/* Titre */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Titre de l'annonce <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Belle fille disponible sur Cocody pour moments intimes"
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20"
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              {title.length} / 100 caractères (min. 10)
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description complète <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez vos services, vos conditions, vos horaires, si vous recevez ou vous vous déplacez..."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20 leading-relaxed"
              required
            />
          </div>

          {/* VILLE (CHAMP LIBRE - STRICTEMENT SANS AUTO-COMPLÉTION FORCÉE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Ville <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Écrivez votre ville (ex: Abidjan, Bouaké)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Champ libre : écrivez le nom de votre ville
              </span>
            </div>

            {/* Adresse du service */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Adresse / Quartier du service <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Cocody Angré 8e tranche"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20"
                required
              />
            </div>
          </div>

          {/* NUMÉRO DE TÉLÉPHONE & CANAL */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Numéro de téléphone <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+225 07..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20 font-mono"
              required
            />

            <div className="mt-2.5">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Moyen de contact autorisé sur ce numéro :
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CONTACT_CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setContactChannel(ch.id as any)}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition-all ${
                      contactChannel === ch.id
                        ? "bg-brand-blue-800 text-white border-brand-blue-800"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {ch.id === "WHATSAPP"
                      ? "WhatsApp"
                      : ch.id === "CALL"
                      ? "Appel seul"
                      : "Les Deux"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CLIENTÈLE ACCEPTÉE */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Clientèle acceptée <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CLIENT_TYPES.map((cl) => (
                <button
                  key={cl.id}
                  type="button"
                  onClick={() => setAcceptedClient(cl.id as any)}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition-all ${
                    acceptedClient === cl.id
                      ? "bg-brand-pink-500 text-white border-brand-pink-500 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {cl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3 : CATÉGORIE & SOUS-CATÉGORIES */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Catégorie & Prestations
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Choisissez la catégorie principale :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                    selectedCategory === cat.id
                      ? "bg-brand-pink-50 border-brand-pink-500 text-brand-pink-600 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Sélectionnez une ou plusieurs sous-catégories :
            </label>
            <div className="grid grid-cols-2 gap-2">
              {activeCategoryObj.subcategories.map((sub) => {
                const isSelected = selectedSubcategories.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleToggleSubcategory(sub)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-brand-blue-50 border-brand-blue-800 text-brand-blue-900 font-bold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{sub}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-blue-800" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 4 : CHOIX DE LA FORMULE DE PUBLICATION */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900">
              Choisissez votre formule de visibilité
            </h2>
            {isFirstAdFree && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                1ère Annonce Standard Offerte !
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(FORMULAS).map((f) => {
              const isSelected = selectedFormula === f.id;
              const isFreeStandard = f.id === "STANDARD" && isFirstAdFree;

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFormula(f.id)}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all relative ${
                    isSelected
                      ? f.id === "VIP"
                        ? "border-amber-500 bg-amber-50/30 shadow-md ring-2 ring-amber-500/20"
                        : "border-brand-pink-500 bg-brand-pink-50/30 shadow-md ring-2 ring-brand-pink-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  {/* Badge promo ou populaire */}
                  {f.isPopular && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-brand-pink-500 text-white shadow-sm">
                      Le plus populaire
                    </span>
                  )}
                  {f.id === "VIP" && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-sm">
                      ⭐ Visibilité Maximale
                    </span>
                  )}

                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-extrabold text-sm text-slate-900">{f.name}</h3>
                    <span className="text-xs font-bold text-slate-500">
                      {f.durationDays} jours
                    </span>
                  </div>

                  <div className="my-2">
                    {isFreeStandard ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-emerald-600">0 FCFA</span>
                        <span className="text-xs text-slate-400 line-through">1 200 FCFA</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Gratuit (Bienvenue)
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-black text-brand-pink-600">
                        {f.price.toLocaleString()} FCFA
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOUTON DE SOUMISSION / PAIEMENT GENIUSPAY */}
        <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Total à régler :</span>
            <span className="text-xl font-black text-brand-pink-400">
              {selectedFormula === "STANDARD" && isFirstAdFree
                ? "0 FCFA (Offert)"
                : `${FORMULAS[selectedFormula].price.toLocaleString()} FCFA`}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 via-pink-600 to-rose-600 hover:from-brand-pink-600 hover:to-rose-700 text-white font-extrabold text-sm shadow-lg shadow-brand-pink-500/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Traitement sécurisé en cours...</span>
            ) : selectedFormula === "STANDARD" && isFirstAdFree ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Publier mon annonce gratuitement</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Payer et publier via GeniusPay (Wave, Orange, MTN, Carte)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Paiement sécurisé crypté par GeniusPay. Publication automatique dès confirmation.</span>
          </p>
        </div>
      </form>
    </div>
  );
}
