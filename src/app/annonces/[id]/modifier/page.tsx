"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CATEGORIES,
  CITIES,
  CLIENT_TYPES,
  CONTACT_CHANNELS,
  EDIT_AD_PRICE,
  MIN_AD_TITLE_LENGTH,
  MIN_AD_DESCRIPTION_LENGTH,
  MAX_AD_PHOTOS as MAX_PHOTOS,
} from "@/lib/constants";
import { validateAdContent } from "@/lib/moderation";
import { compressImageFile } from "@/lib/imageCompress";
import type { Ad, AcceptedClient, ContactChannel } from "@/lib/types";
import {
  Camera,
  Upload,
  X,
  Pencil,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";


export default function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactChannel, setContactChannel] = useState<ContactChannel>("BOTH");
  const [acceptedClient, setAcceptedClient] = useState<AcceptedClient>("HOMME");
  const [selectedCategory, setSelectedCategory] = useState<string>("escorte-girl");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [adRes, meRes] = await Promise.all([
          fetch(`/api/ads/${resolvedParams.id}`),
          fetch("/api/auth/me"),
        ]);

        if (meRes.status === 401) {
          router.push(`/connexion?next=/annonces/${resolvedParams.id}/modifier`);
          return;
        }
        if (adRes.status === 404) {
          if (!cancelled) setLoadError("Cette annonce n'existe plus ou n'est plus en ligne.");
          return;
        }

        const adData = await adRes.json();
        const meData = await meRes.json();
        if (!adRes.ok || !meRes.ok) {
          if (!cancelled) setLoadError("Erreur lors du chargement de l'annonce.");
          return;
        }

        const ad: Ad = adData.ad;
        if (ad.user_id !== meData.user.id) {
          if (!cancelled) setLoadError("Cette annonce ne vous appartient pas.");
          return;
        }

        if (cancelled) return;
        setTitle(ad.title);
        setDescription(ad.description);
        setCity(ad.city);
        setAddress(ad.address);
        setPhoneNumber(ad.phone_number);
        setContactChannel(ad.contact_channels);
        setAcceptedClient(ad.accepted_clients);
        setSelectedCategory(ad.category);
        setSelectedSubcategories(ad.subcategories?.length ? ad.subcategories : []);
        setPhotos(ad.photos);
      } catch {
        if (!cancelled) setLoadError("Erreur réseau lors du chargement de l'annonce.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [resolvedParams.id, router]);

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

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`Vous ne pouvez avoir que ${MAX_PHOTOS} photos maximum par annonce.`);
      e.target.value = "";
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setErrorMsg(`Seules les ${remainingSlots} premières photos ont été ajoutées (maximum ${MAX_PHOTOS}).`);
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
      setErrorMsg("Veuillez sélectionner votre ville.");
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

    const moderation = validateAdContent(title, description);
    if (!moderation.isValid) {
      setErrorMsg(moderation.reason || "Contenu rejeté par le filtre de sécurité.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/ads/${resolvedParams.id}`, {
        method: "PATCH",
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
          photos,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push(`/connexion?next=/annonces/${resolvedParams.id}/modifier`);
        return;
      }
      if (!res.ok) {
        setErrorMsg(data.error || "Une erreur est survenue lors de la modification.");
        return;
      }

      if (data.free) {
        // La page de l'annonce a très probablement déjà été visitée juste
        // avant (c'est comme ça qu'on arrive sur ce formulaire) — sans
        // refresh(), Next.js peut resservir sa version mise en cache
        // AVANT modification, donnant l'impression que rien n'a changé.
        router.refresh();
        router.push(`/annonces/${resolvedParams.id}`);
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

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 flex flex-col items-center gap-2 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs">Chargement de l&apos;annonce...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-sm font-bold text-slate-800">{loadError}</p>
        <Link
          href="/profil"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-pink-500 hover:bg-brand-pink-600 text-white font-bold text-xs shadow-md transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à mon profil</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="text-center">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-blue-50 text-brand-blue-800 border border-brand-blue-200 mb-2">
          <Pencil className="w-3.5 h-3.5" />
          <span>Modification d&apos;annonce</span>
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Modifiez votre annonce</h1>
        <p className="text-xs text-slate-500 mt-1">
          La formule et sa durée restante ne changent pas — seul le contenu est mis à jour.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">{errorMsg}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-brand-pink-500" />
              <span>Photos de l&apos;annonce</span>
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
                {/* eslint-disable-next-line @next/next/no-img-element -- photo hébergée sur Supabase Storage (ou Unsplash pour le placeholder), hors domaines optimisés par défaut — voir next.config.ts */}
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
          <p className="text-[11px] text-slate-400">Format JPEG, PNG ou WEBP. 8 Mo max par photo.</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Détails de l&apos;annonce</h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Titre de l&apos;annonce <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20"
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">{title.length} / 100 caractères (min. 10)</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description complète <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                    onClick={() => setContactChannel(ch.id as ContactChannel)}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition-all ${
                      contactChannel === ch.id
                        ? "bg-brand-blue-800 text-white border-brand-blue-800"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {ch.id === "WHATSAPP" ? "WhatsApp" : ch.id === "CALL" ? "Appel seul" : "Les Deux"}
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
                  onClick={() => setAcceptedClient(cl.id as AcceptedClient)}
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

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Catégorie & Prestations</h2>

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

        <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Coût de la modification :</span>
            <span className="text-xl font-black text-brand-pink-400">{EDIT_AD_PRICE.toLocaleString()} FCFA</span>
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
                <span>Enregistrer les modifications</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Paiement sécurisé et crypté (ou gratuit tant que le lancement du site est en cours).</span>
          </p>
        </div>
      </form>
    </div>
  );
}
