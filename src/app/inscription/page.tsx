"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GENDERS } from "@/lib/constants";
import PasswordField from "@/components/PasswordField";
import { compressImageFile } from "@/lib/imageCompress";
import {
  User,
  Mail,
  Calendar,
  Camera,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterPage() {
  const router = useRouter();

  // Étape : 1 = Formulaire, 2 = Code OTP à 6 chiffres, 3 = Bienvenue
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Champs d'inscription
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"Femme" | "Homme" | "Transgenre">("Femme");
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Code OTP
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // États UI
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Calcul d'âge strict (+18 ans obligatoire)
  const isAdult = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date();
    const birth = new Date(dateString);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 18;
  };

  // Upload réel de la photo de profil (sans session : le compte n'existe pas encore)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg("");
    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImageFile(file, 500, 0.85);
      const formData = new FormData();
      formData.append("file", compressed);
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erreur lors de l'envoi de la photo.");
        return;
      }
      setProfilePhoto(data.url);
    } catch {
      setErrorMsg("Erreur réseau lors de l'envoi de la photo.");
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const sendOtp = async () => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, birthDate, gender, profilePhoto, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Une erreur est survenue lors de l'inscription.");
    }
  };

  // Soumission étape 1 : Envoi du code OTP
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || username.length < 3) {
      setErrorMsg("Le nom d'utilisateur doit comporter au moins 3 caractères.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Veuillez renseigner une adresse email valide.");
      return;
    }
    if (!birthDate || !isAdult(birthDate)) {
      setErrorMsg("Vous devez impérativement avoir 18 ans ou plus pour vous inscrire.");
      return;
    }
    if (!profilePhoto) {
      setErrorMsg("La photo de profil est obligatoire dès l'inscription.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMsg(`Le mot de passe doit comporter au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp();
      setResendCooldown(60);
      setStep(2);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg("");
    setIsLoading(true);
    try {
      await sendOtp();
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  // Saisie des 6 chiffres OTP
  const handleOtpChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otpCode];
    newOtp[index] = val.slice(-1);
    setOtpCode(newOtp);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Validation finale du code OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const entered = otpCode.join("");

    if (entered.length < 6) {
      setErrorMsg("Veuillez renseigner les 6 chiffres du code reçu par email.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: entered }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Code OTP incorrect ou expiré.");
        return;
      }

      // Le cookie de session est déjà posé par l'API (auto-login).
      setStep(3);
    } catch {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 space-y-6">
      {/* HEADER */}
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-tr from-brand-pink-500 to-brand-blue-800 flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-slate-900">
          {step === 1
            ? "Créer votre compte annonceur"
            : step === 2
            ? "Vérification par code OTP"
            : "Inscription Réussie !"}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {step === 1
            ? "Rejoignez KIABA RENCONTRE et profitez d'une 1ère annonce gratuite"
            : step === 2
            ? `Un code à 6 chiffres a été envoyé à ${email}`
            : "Votre compte et votre profil ont été créés avec succès."}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* ÉTAPE 1 : FORMULAIRE COMPLET D'INSCRIPTION */}
      {step === 1 && (
        <form onSubmit={handleRegisterSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {/* PHOTO DE PROFIL OBLIGATOIRE DÈS L'INSCRIPTION */}
          <div className="flex flex-col items-center justify-center text-center pb-3 border-b border-slate-100">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-brand-pink-500 shadow-md bg-slate-100 flex items-center justify-center">
                {isUploadingPhoto ? (
                  <Loader2 className="w-6 h-6 text-brand-pink-500 animate-spin" />
                ) : profilePhoto ? (
                  <img src={profilePhoto} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <label
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand-pink-500 text-white flex items-center justify-center shadow hover:bg-brand-pink-600 transition-colors cursor-pointer"
                title="Choisir une photo"
              >
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                />
              </label>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-2">
              Photo de profil <span className="text-rose-500">* (Obligatoire)</span>
            </p>
            <p className="text-[10px] text-slate-400">JPEG, PNG ou WEBP — 8 Mo max</p>
          </div>

          {/* Pseudo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nom d'utilisateur <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Sexe_gamine"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Adresse email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre-email@exemple.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20"
                required
              />
            </div>
          </div>

          {/* Date de naissance (+18 ans) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Date de naissance <span className="text-rose-500">* (Majeur +18)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20"
                required
              />
            </div>
          </div>

          {/* Genre */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Genre <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold text-center transition-all ${
                    gender === g
                      ? "bg-brand-pink-500 text-white border-brand-pink-500 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Mot de passe <span className="text-rose-500">*</span>
            </label>
            <PasswordField
              value={password}
              onChange={setPassword}
              placeholder={`Minimum ${MIN_PASSWORD_LENGTH} caractères`}
              autoComplete="new-password"
              required
            />
          </div>

          {/* Confirmation Mot de passe */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Confirmer le mot de passe <span className="text-rose-500">*</span>
            </label>
            <PasswordField
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Retapez le mot de passe"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isUploadingPhoto}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 hover:from-brand-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <span>Génération du code OTP...</span>
            ) : (
              <>
                <span>Recevoir mon code OTP à 6 chiffres</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500 pt-2">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-brand-pink-600 font-bold hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      )}

      {/* ÉTAPE 2 : VALIDATION CODE OTP À 6 CHIFFRES */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-brand-blue-800 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <p className="text-xs text-slate-600">
            Saisissez le code de validation reçu par email :
          </p>

          {/* 6 CASES POUR LE CODE OTP */}
          <div className="flex justify-center gap-2 my-4">
            {otpCode.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, idx)}
                className="w-11 h-12 text-center text-xl font-black rounded-xl border-2 border-slate-200 focus:border-brand-pink-500 focus:ring-2 focus:ring-brand-pink-500/20 focus:outline-none"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-pink-500 to-rose-600 hover:from-brand-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <span>Vérification du code...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Valider et créer mon profil</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || isLoading}
            className="text-xs text-slate-500 hover:text-slate-800 underline disabled:no-underline disabled:text-slate-300"
          >
            {resendCooldown > 0 ? `Renvoyer le code (${resendCooldown}s)` : "Renvoyer le code"}
          </button>

          <div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Modifier mes informations
            </button>
          </div>
        </form>
      )}

      {/* ÉTAPE 3 : BIENVENUE & PROFIL INITIALISÉ */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-300 shadow-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900">
            Félicitations, {username} !
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            Votre compte et votre profil ont été créés avec succès. Vous venez de recevoir un <strong>email de bienvenue</strong> détaillant toutes les formules, options de boost et tarifs.
          </p>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            🎁 1ère Annonce Standard GRATUITE disponible immédiatement !
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => router.push("/annonces/nouvelle")}
              className="w-full py-3 px-4 rounded-xl bg-brand-pink-500 hover:bg-brand-pink-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Publier mon annonce gratuite</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => router.push("/profil")}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              Accéder à mon espace profil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
