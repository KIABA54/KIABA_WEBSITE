"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  CITIES,
  CLIENT_TYPES,
  CONTACT_CHANNELS,
  FORMULAS,
  MIN_AD_TITLE_LENGTH,
  MIN_AD_DESCRIPTION_LENGTH,
  MAX_AD_PHOTOS as MAX_PHOTOS,
} from "@/lib/constants";
import { validateAdContent } from "@/lib/moderation";
import { compressImageFile } from "@/lib/imageCompress";
import {
  Camera,
  Upload,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";


export default function NewAdPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+225 ");
  const [contactChannel, setContactChannel] = useState<"WHATSAPP" | "CALL" | "BOTH">("BOTH");
  const [acceptedClient, setAcceptedClient] = useState<"HOMME" | "FEMME" | "TRANSGENRE" | "TOUS">("HOMME");

  const [selectedCategory, setSelectedCategory] = useState<string>("escorte-girl");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(["Vaginal"]);

  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [selectedFormula, setSelectedFormula] = useState<"STANDARD" | "PRO" | "PRO_PLUS" | "VIP">("STANDARD");

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  const handleToggleSubcategory = (sub: string) => {
    if (selectedSubcategories.includes(sub)) {
      if (selectedSubcategories.length === 1) return;
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

  // Upload réel d'une ou plusieurs photos vers Supabase Storage. Le champ
  // accepte une sélection multiple (attribut `multiple` sur l'input) — on
  // uploade chaque fichier retenu l'un après l'autre.
  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`Vous ne pouvez ajouter que ${MAX_PHOTOS} photos maximum par annonce.`);
      e.target.value = "";
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setErrorMsg(
        `Seules les ${remainingSlots} premières photos ont été ajoutées (maximum ${MAX_PHOTOS} par annonce).`
      );
    } else {
      setErrorMsg("");
    }

    setIsUploadingPhoto(true);
    try {
      for (const file of filesToUpload) {
        const compressed = await compressImageFile(file);
        const formData = new FormData();
        formData.append("file", compressed);
        const res = await fetch("/api/uploads", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "Erreur lors de l'envoi d'une photo.");
          continue;
        }
        setPhotos((prev) => [...prev, data.url]);
      }
    } catch {
      setErrorMsg("Erreur réseau lors de l'envoi des photos.");
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim() || title.length < MIN_AD_TITLE_LENGTH) {
      setErrorMsg(`Le titre doit comporter au moins ${MIN_AD_TITLE_LENGTH} caractères.`);
      return;
    }
    if (!description.trim() || description.length < MIN_AD_DESCRIPTION_LENGTH) {
      setErrorMsg(`La description doit comporter au moins ${MIN_AD_DESCRIPTION_LENGTH} caractères.`);
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

    // Feedback immédiat côté client — le vrai filtre fait foi côté serveur.
    const moderation = validateAdContent(title, description);
    if (!moderation.isValid) {
      setErrorMsg(moderation.reason || "Contenu rejeté par le filtre de sécurité.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          city,
          address,
          phone_number: phoneNumber,
          contact_channels: contactChannel,
          accepted_clients: acceptedClient,
          category: selectedCategory,
          subcategories: selectedSubcategories,
          formula: selectedFormula,
          photos,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push("/connexion?next=/annonces/nouvelle");
        return;
      }
      if (!res.ok) {
        setErrorMsg(data.error || "Une erreur est survenue lors de la publication.");
        return;
      }

      if (data.free) {
        // Va directement sur l'annonce plutôt que par la page de reçu
        // intermédiaire : c'est le résultat concret que l'utilisateur veut
        // voir après publication, sans détour ni dépendance à une page dont
        // le contenu dynamique ne s'affiche qu'après hydratation JS.
        router.push(`/annonces/${data.ad_id}`);
      } else if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setErrorMsg("Réponse inattendue du serveur.");
      }
    } catch {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
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
              {photos.length} / {MAX_PHOTOS} photos (1 obligatoire)
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

            {photos.length < MAX_PHOTOS && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-pink-400 hover:bg-brand-pink-50/50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-brand-pink-600 transition-all cursor-pointer">
                {isUploadingPhoto ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px] font-bold">+ Ajouter</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={handleAddPhoto}
                  disabled={isUploadingPhoto}
                />
              </label>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Format JPEG, PNG ou WEBP. 8 Mo max par photo.
          </p>
        </div>

        {/* SECTION 2 : INFORMATIONS PRINCIPALES */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Détails de l'annonce
          </h2>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Ville <span className="text-rose-500">*</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20 bg-white"
                required
              >
                <option value="" disabled>
                  Sélectionnez votre ville
                </option>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

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
                    onClick={() => setContactChannel(ch.id)}
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

          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Clientèle acceptée <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CLIENT_TYPES.map((cl) => (
                <button
                  key={cl.id}
                  type="button"
                  onClick={() => setAcceptedClient(cl.id)}
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
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Choisissez votre formule de visibilité
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(FORMULAS).map((f) => {
              const isSelected = selectedFormula === f.id;

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
                  {f.isPopular && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-brand-pink-500 text-white shadow-sm">
                      Le plus populaire
                    </span>
                  )}
                  {f.id === "VIP" && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-gradient-to-r from-amber-500 to-brand-pink-700 text-white shadow-sm">
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
                    <span className="text-base font-black text-brand-pink-600">
                      {f.price.toLocaleString()} FCFA
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400">
            Si votre 1ère annonce Standard gratuite est disponible, elle sera appliquée automatiquement.
          </p>
        </div>

        {/* BOUTON DE SOUMISSION / PAIEMENT */}
        <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Formule sélectionnée :</span>
            <span className="text-xl font-black text-brand-pink-400">
              {FORMULAS[selectedFormula].price.toLocaleString()} FCFA
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isUploadingPhoto}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 via-brand-pink-600 to-brand-pink-700 hover:from-brand-pink-600 hover:to-brand-pink-800 text-white font-extrabold text-sm shadow-lg shadow-brand-pink-500/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <span>Traitement sécurisé en cours...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Payer et publier (Wave, Orange, MTN, Carte)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Paiement sécurisé et crypté. Publication automatique dès confirmation (ou gratuite si vous y êtes éligible).</span>
          </p>
        </div>
      </form>
    </div>
  );
}
