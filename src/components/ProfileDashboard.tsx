"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FORMULAS, EDIT_AD_PRICE, BOOST_PERCENTAGE, getCityLabel } from "@/lib/constants";
import { Ad, User as UserType } from "@/lib/types";
import PasswordField from "@/components/PasswordField";
import {
  Mail,
  Edit3,
  Trash2,
  RefreshCw,
  Zap,
  Lock,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldAlert,
  LogOut,
  Loader2,
  Eye,
} from "lucide-react";

interface ProfileDashboardProps {
  initialUser: UserType;
  initialAds: Ad[];
}

export default function ProfileDashboard({ initialUser, initialAds }: ProfileDashboardProps) {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(initialUser);
  const [myAds, setMyAds] = useState<Ad[]>(initialAds);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [activeTab, setActiveTab] = useState<"ONLINE" | "OFFLINE" | "SECURITY">("ONLINE");

  // Modales
  const [boostModalAd, setBoostModalAd] = useState<Ad | null>(null);
  const [deleteModalAd, setDeleteModalAd] = useState<Ad | null>(null);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [accountDeleteOtp, setAccountDeleteOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Changement de mot de passe
  const [pwOtpSent, setPwOtpSent] = useState(false);
  const [pwCode, setPwCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [notification, setNotification] = useState("");
  const [actionError, setActionError] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 5000);
  };

  const loadData = async () => {
    setIsLoadingData(true);
    setLoadError("");
    try {
      const [meRes, adsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/ads/mine"),
      ]);

      if (meRes.status === 401) {
        router.push("/connexion?next=/profil");
        return;
      }

      const meData = await meRes.json();
      const adsData = await adsRes.json();

      if (!meRes.ok) throw new Error(meData.error || "Erreur lors du chargement du profil.");
      if (!adsRes.ok) throw new Error(adsData.error || "Erreur lors du chargement de vos annonces.");

      setUser(meData.user);
      setMyAds(adsData.ads || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Le tout premier rendu correspond déjà aux données fournies par le
  // serveur — on ne refait pas cet appel au montage, seulement après une
  // action (suppression, boost...) qui a besoin de rafraîchir la liste.
  const skipNextFetch = useRef(true);
  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onlineAds = myAds.filter((a) => a.status === "ONLINE");
  const offlineAds = myAds.filter((a) => a.status === "OFFLINE" || a.status === "PENDING_PAYMENT");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  // ACTION : Booster / Renouveler — passe par le paiement réel. La
  // modification de contenu (EDIT) est un flux séparé : elle a besoin d'un
  // vrai formulaire, donc elle navigue vers /annonces/[id]/modifier plutôt
  // que de payer ici sans rien à éditer ensuite.
  const initiatePaidAction = async (ad: Ad, actionType: "BOOST" | "RENEWAL") => {
    setActionError("");
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad_id: ad.id, action_type: actionType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Erreur lors de l'initiation du paiement.");
        return;
      }
      if (data.free) {
        // Mode lancement : l'action est déjà appliquée, pas de paiement à faire.
        showNotification("Terminé — c'est gratuit pour le moment, aucun paiement requis.");
        await loadData();
        return;
      }
      if (!data.checkout_url) {
        setActionError("Erreur lors de l'initiation du paiement.");
        return;
      }
      window.location.href = data.checkout_url;
    } catch {
      setActionError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmBoost = (ad: Ad) => initiatePaidAction(ad, "BOOST");
  const handleEditAd = (ad: Ad) => router.push(`/annonces/${ad.id}/modifier`);
  const handleRenewAd = (ad: Ad) => initiatePaidAction(ad, "RENEWAL");

  // ACTION : Supprimer une annonce
  const handleConfirmDeleteAd = async () => {
    if (!deleteModalAd) return;
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/ads/${deleteModalAd.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Erreur lors de la suppression.");
        return;
      }
      setMyAds((prev) => prev.filter((a) => a.id !== deleteModalAd.id));
      setDeleteModalAd(null);
      showNotification("L'annonce a été définitivement supprimée.");
    } catch {
      setActionError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // ACTION : Demander la suppression du compte (OTP)
  const handleRequestAccountDeletion = async () => {
    setActionError("");
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account/request", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Erreur lors de l'envoi du code.");
        return;
      }
      setOtpSent(true);
    } catch {
      setActionError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmAccountDeletion = async () => {
    setActionError("");
    if (accountDeleteOtp.length < 6) {
      setActionError("Veuillez renseigner les 6 chiffres du code reçu par email.");
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accountDeleteOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Code invalide.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setActionError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // ACTION : Changer le mot de passe (OTP)
  const handleRequestPasswordChange = async () => {
    setActionError("");
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/auth/change-password/request", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Erreur lors de l'envoi du code.");
        return;
      }
      setPwOtpSent(true);
    } catch {
      setActionError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmPasswordChange = async () => {
    setActionError("");
    if (pwCode.length < 6 || newPassword.length < 8) {
      setActionError("Code à 6 chiffres et mot de passe d'au moins 8 caractères requis.");
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/auth/change-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pwCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Code invalide.");
        return;
      }
      setPwOtpSent(false);
      setPwCode("");
      setNewPassword("");
      showNotification("Votre mot de passe a été mis à jour.");
    } catch {
      setActionError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="max-w-2xl mx-auto py-16 flex flex-col items-center gap-2 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs">Chargement de votre profil...</p>
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
        <p className="text-sm text-rose-600 font-semibold">{loadError || "Impossible de charger votre profil."}</p>
        <button
          onClick={loadData}
          className="py-2 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* CARTE PROFIL RÉSUMÉ */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
        <img
          src={user.profile_photo_url}
          alt={user.username}
          className="w-20 h-20 rounded-full object-cover border-4 border-brand-pink-500 shadow-md flex-shrink-0"
        />

        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-lg font-black text-slate-900">{user.username}</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-pink-50 text-brand-pink-600 border border-brand-pink-200">
              {user.gender}
            </span>
          </div>

          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{user.email}</span>
          </p>

          <p className="text-[11px] text-slate-400">
            {user.free_ad_eligible ? "1ère annonce gratuite disponible" : "Membre vérifié • Annonceur actif"}
          </p>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
          <Link
            href="/annonces/nouvelle"
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 text-white font-bold text-xs shadow-md hover:from-brand-pink-600 hover:to-rose-700 transition-all text-center"
          >
            + Nouvelle annonce
          </Link>
          <button
            onClick={handleLogout}
            className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION PAR ONGLETS */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("ONLINE")}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "ONLINE"
              ? "border-brand-pink-500 text-brand-pink-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Annonces en ligne</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
            {onlineAds.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("OFFLINE")}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "OFFLINE"
              ? "border-brand-pink-500 text-brand-pink-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Annonces hors ligne</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
            {offlineAds.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("SECURITY")}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ml-auto ${
            activeTab === "SECURITY"
              ? "border-brand-blue-800 text-brand-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Sécurité & Compte</span>
        </button>
      </div>

      {/* ONGLET 1 : ANNONCES EN LIGNE */}
      {activeTab === "ONLINE" && (
        <div className="space-y-3">
          {onlineAds.length > 0 ? (
            onlineAds.map((ad) => (
              <div
                key={ad.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex gap-3">
                  <img
                    src={ad.photos[0]}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-brand-pink-500 text-white">
                        {ad.formula}
                      </span>
                      {ad.is_boosted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-600 text-white">
                          BOOSTÉ
                        </span>
                      )}
                      <span className="text-[11px] text-emerald-600 font-bold ml-auto">
                        ● En ligne
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                      {ad.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
                      <span>{getCityLabel(ad.city)} • Expire le : {new Date(ad.expires_at).toLocaleDateString()}</span>
                      <span className="inline-flex items-center gap-0.5 font-bold text-slate-600">
                        <Eye className="w-3 h-3" aria-hidden="true" />
                        {ad.views} vue{ad.views > 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  {!ad.is_boosted && ad.formula !== "VIP" && (
                    <button
                      onClick={() => setBoostModalAd(ad)}
                      disabled={isActionLoading}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Booster (60%)</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleEditAd(ad)}
                    disabled={isActionLoading}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifier ({EDIT_AD_PRICE} FCFA)</span>
                  </button>

                  <button
                    onClick={() => setDeleteModalAd(ad)}
                    disabled={isActionLoading}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1 transition-colors ml-auto disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-xs text-slate-500">
              Vous n'avez aucune annonce en ligne pour le moment.
            </p>
          )}
        </div>
      )}

      {/* ONGLET 2 : ANNONCES HORS LIGNE (EXPIRÉES) */}
      {activeTab === "OFFLINE" && (
        <div className="space-y-3">
          {offlineAds.length > 0 ? (
            offlineAds.map((ad) => (
              <div
                key={ad.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 opacity-90"
              >
                <div className="flex gap-3">
                  <img
                    src={ad.photos[0]}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover grayscale flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {ad.status === "PENDING_PAYMENT" ? "En attente de paiement" : "Expirée (Hors ligne)"}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 mt-1">
                      {ad.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Formule initiale : {ad.formula} ({FORMULAS[ad.formula]?.price.toLocaleString()} FCFA)
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  {ad.status === "OFFLINE" && (
                    <button
                      onClick={() => handleRenewAd(ad)}
                      disabled={isActionLoading}
                      className="py-2 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 text-white font-bold text-xs shadow hover:from-brand-pink-600 flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Renouveler ({FORMULAS[ad.formula]?.price.toLocaleString()} FCFA)</span>
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteModalAd(ad)}
                    disabled={isActionLoading}
                    className="text-xs text-rose-600 font-semibold hover:underline disabled:opacity-50"
                  >
                    Supprimer définitivement
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-xs text-slate-500">
              Aucune annonce hors ligne.
            </p>
          )}
        </div>
      )}

      {/* ONGLET 3 : SÉCURITÉ, MOT DE PASSE & SUPPRESSION DE COMPTE */}
      {activeTab === "SECURITY" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          {/* MODIFIER MOT DE PASSE AVEC CODE OTP */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-brand-blue-800" />
              <span>Modifier mon mot de passe</span>
            </h2>
            <p className="text-xs text-slate-500">
              Pour des raisons de sécurité, un code OTP à 6 chiffres vous sera envoyé par email pour valider tout changement.
            </p>

            {!pwOtpSent ? (
              <button
                onClick={handleRequestPasswordChange}
                disabled={isActionLoading}
                className="py-2 px-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors disabled:opacity-50"
              >
                Envoyer un code OTP de réinitialisation
              </button>
            ) : (
              <div className="space-y-2.5 max-w-xs">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pwCode}
                  onChange={(e) => setPwCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Code OTP (6 chiffres)"
                  className="w-full text-center tracking-widest text-sm font-mono py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-blue-500"
                />
                <PasswordField
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Nouveau mot de passe (8 caractères min.)"
                  autoComplete="new-password"
                />
                <button
                  onClick={handleConfirmPasswordChange}
                  disabled={isActionLoading}
                  className="w-full py-2.5 rounded-xl bg-brand-blue-800 hover:bg-brand-blue-900 text-white text-xs font-bold disabled:opacity-50"
                >
                  Valider le nouveau mot de passe
                </button>
              </div>
            )}
          </div>

          {/* ZONE DANGER : SUPPRESSION DÉFINITIVE DU COMPTE + EMAIL BLACKLIST */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3">
            <h3 className="text-sm font-extrabold text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Zone Danger : Suppression définitive du compte</span>
            </h3>

            <div className="text-xs text-rose-800 leading-relaxed space-y-1">
              <p>
                <strong>ATTENTION :</strong> La suppression de votre compte est <strong>irréversible</strong>.
              </p>
              <p>
                • Toutes vos annonces seront immédiatement supprimées de la plateforme.
              </p>
              <p>
                • Vos données personnelles et photos seront totalement purgées de notre base de données.
              </p>
              <p className="font-bold text-rose-950 underline">
                • Votre adresse email ({user.email}) sera inscrite sur la liste d'interdiction (Blacklist). Vous ne pourrez PLUS JAMAIS créer de compte avec cette adresse email sur KIABA RENCONTRE.
              </p>
            </div>

            <button
              onClick={() => setDeleteAccountModal(true)}
              className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition-colors"
            >
              Je souhaite supprimer mon compte
            </button>
          </div>
        </div>
      )}

      {/* MODALE BOOST (60% DU PRIX) */}
      {boostModalAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">
                Booster votre annonce
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                L'annonce sera mise en avant en tête de liste pour tout le reste de sa durée de vie.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border text-center">
              <span className="text-xs text-slate-500">Tarif du Boost (60%) :</span>
              <p className="text-xl font-black text-emerald-600 mt-0.5">
                {Math.round((FORMULAS[boostModalAd.formula]?.price || 1200) * BOOST_PERCENTAGE).toLocaleString()} FCFA
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setBoostModalAd(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const ad = boostModalAd;
                  setBoostModalAd(null);
                  handleConfirmBoost(ad);
                }}
                disabled={isActionLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                Payer et booster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE SUPPRESSION D'ANNONCE */}
      {deleteModalAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Supprimer cette annonce ?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cette action est <strong>définitive et irréversible</strong>. L'annonce sera immédiatement retirée du site.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteModalAd(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDeleteAd}
                disabled={isActionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE SUPPRESSION DÉFINITIVE DE COMPTE (AVEC OTP) */}
      {deleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-300 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-rose-600 uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5" />
                <span>Confirmation de suppression</span>
              </h3>
              <button
                onClick={() => {
                  setDeleteAccountModal(false);
                  setOtpSent(false);
                  setAccountDeleteOtp("");
                }}
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pour valider la suppression irréversible de votre compte et le bannissement de votre email ({user.email}), veuillez renseigner le code OTP à 6 chiffres envoyé par email.
            </p>

            {!otpSent ? (
              <button
                type="button"
                onClick={handleRequestAccountDeletion}
                disabled={isActionLoading}
                className="w-full py-3 rounded-xl bg-brand-blue-800 text-white text-xs font-bold hover:bg-brand-blue-900 disabled:opacity-50"
              >
                Recevoir le code OTP par email
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={accountDeleteOtp}
                  onChange={(e) => setAccountDeleteOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Code OTP (6 chiffres)"
                  className="w-full text-center tracking-widest text-lg font-mono py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={handleConfirmAccountDeletion}
                  disabled={isActionLoading}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow disabled:opacity-50"
                >
                  Supprimer définitivement mon compte
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
