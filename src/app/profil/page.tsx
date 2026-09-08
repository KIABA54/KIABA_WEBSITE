"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { INITIAL_ADS } from "@/lib/mockData";
import { FORMULAS, EDIT_AD_PRICE, BOOST_PERCENTAGE } from "@/lib/constants";
import { Ad } from "@/lib/types";
import {
  User,
  Mail,
  Calendar,
  Layers,
  Sparkles,
  Edit3,
  Trash2,
  RefreshCw,
  Zap,
  Lock,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldAlert,
} from "lucide-react";

export default function ProfileDashboardPage() {
  const router = useRouter();

  // Onglet actif : "ONLINE" ou "OFFLINE" ou "SECURITY"
  const [activeTab, setActiveTab] = useState<"ONLINE" | "OFFLINE" | "SECURITY">("ONLINE");

  // Données utilisateur
  const [user, setUser] = useState({
    username: "Sexe_gamine",
    email: "gamine.ci@gmail.com",
    birth_date: "2002-05-14",
    gender: "Femme",
    profile_photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    free_ad_eligible: false,
  });

  // Annonces de l'utilisateur
  const [myAds, setMyAds] = useState<Ad[]>([
    INITIAL_ADS[0], // En ligne (VIP)
    {
      ...INITIAL_ADS[3], // En ligne (Pro)
      user_id: "usr-1",
    },
    {
      ...INITIAL_ADS[5], // Hors ligne (Expirée)
      id: "ad-expired-1",
      user_id: "usr-1",
      status: "OFFLINE",
      title: "Ancienne annonce expirée (prête à être renouvelée)",
    },
  ]);

  // Modales
  const [boostModalAd, setBoostModalAd] = useState<Ad | null>(null);
  const [deleteModalAd, setDeleteModalAd] = useState<Ad | null>(null);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [accountDeleteOtp, setAccountDeleteOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [notification, setNotification] = useState("");

  const onlineAds = myAds.filter((a) => a.status === "ONLINE");
  const offlineAds = myAds.filter((a) => a.status === "OFFLINE");

  // ACTION : Booster une annonce (60% du prix d'origine)
  const handleConfirmBoost = async (ad: Ad) => {
    const originalPrice = FORMULAS[ad.formula]?.price || 1200;
    const boostPrice = Math.round(originalPrice * BOOST_PERCENTAGE);

    // Redirection vers paiement GeniusPay du Boost
    router.push(`/paiement/simulation?amount=${boostPrice}&ref=BOOST-${ad.id}`);
  };

  // ACTION : Modifier une annonce (999 FCFA)
  const handleEditAd = (ad: Ad) => {
    router.push(`/paiement/simulation?amount=${EDIT_AD_PRICE}&ref=EDIT-${ad.id}&redirect=/annonces/${ad.id}/modifier`);
  };

  // ACTION : Renouveler une annonce (prix de la formule)
  const handleRenewAd = (ad: Ad) => {
    const formulaPrice = FORMULAS[ad.formula]?.price || 1200;
    router.push(`/paiement/simulation?amount=${formulaPrice}&ref=RENEW-${ad.id}`);
  };

  // ACTION : Supprimer une annonce
  const handleConfirmDeleteAd = () => {
    if (!deleteModalAd) return;
    setMyAds(myAds.filter((a) => a.id !== deleteModalAd.id));
    setDeleteModalAd(null);
    setNotification("L'annonce a été définitivement supprimée. Un email de confirmation vous a été envoyé.");
    setTimeout(() => setNotification(""), 4000);
  };

  // ACTION : Demander la suppression du compte
  const handleRequestAccountDeletion = () => {
    setOtpSent(true);
    setNotification("Code OTP de confirmation envoyé à votre adresse email (Code démo: 888999).");
  };

  const handleConfirmAccountDeletion = () => {
    if (accountDeleteOtp !== "888999" && accountDeleteOtp.length < 6) {
      alert("Code OTP invalide.");
      return;
    }
    alert(
      "Compte et annonces définitivement supprimés. Votre adresse email a été inscrite sur liste noire et ne pourra plus jamais être utilisée sur le site."
    );
    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* NOTIFICATION FLOTTANTE */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
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
            Membre vérifié • Annonceur actif
          </p>
        </div>

        <Link
          href="/annonces/nouvelle"
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 text-white font-bold text-xs shadow-md hover:from-brand-pink-600 hover:to-rose-700 transition-all flex-shrink-0"
        >
          + Nouvelle annonce
        </Link>
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
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {ad.city} • Expire le : {new Date(ad.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* BOUTONS D'ACTION SPECIFIQUES */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  {/* BOOSTER (60% DU PRIX) */}
                  {!ad.is_boosted && ad.formula !== "VIP" && (
                    <button
                      onClick={() => setBoostModalAd(ad)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Booster (60%)</span>
                    </button>
                  )}

                  {/* MODIFIER (999 FCFA) */}
                  <button
                    onClick={() => handleEditAd(ad)}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifier ({EDIT_AD_PRICE} FCFA)</span>
                  </button>

                  {/* SUPPRIMER (IRRÉVERSIBLE) */}
                  <button
                    onClick={() => setDeleteModalAd(ad)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1 transition-colors ml-auto"
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
                      Expirée (Hors ligne)
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 mt-1">
                      {ad.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Formule initiale : {ad.formula} ({FORMULAS[ad.formula]?.price.toLocaleString()} FCFA)
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleRenewAd(ad)}
                    className="py-2 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 text-white font-bold text-xs shadow hover:from-brand-pink-600 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Renouveler ({FORMULAS[ad.formula]?.price.toLocaleString()} FCFA)</span>
                  </button>

                  <button
                    onClick={() => setDeleteModalAd(ad)}
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Supprimer définitivement
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-xs text-slate-500">
              Aucune annonce expirée.
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
            <button
              onClick={() => alert("Code OTP de changement de mot de passe envoyé par email !")}
              className="py-2 px-3.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              Envoyer un code OTP de réinitialisation
            </button>
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
                onClick={() => handleConfirmBoost(boostModalAd)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Payer via GeniusPay
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
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
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
              <button onClick={() => setDeleteAccountModal(false)}>
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
                className="w-full py-3 rounded-xl bg-brand-blue-800 text-white text-xs font-bold hover:bg-brand-blue-900"
              >
                Recevoir le code OTP par email
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  maxLength={6}
                  value={accountDeleteOtp}
                  onChange={(e) => setAccountDeleteOtp(e.target.value)}
                  placeholder="Code OTP (6 chiffres)"
                  className="w-full text-center tracking-widest text-lg font-mono py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={handleConfirmAccountDeletion}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow"
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
