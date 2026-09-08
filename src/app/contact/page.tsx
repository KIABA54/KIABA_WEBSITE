import { Mail, ShieldAlert } from "lucide-react";

export const metadata = {
  title: "Contactez-nous — KIABA RENCONTRE",
};

export default function ContactPage() {
  return (
    <div className="max-w-lg mx-auto space-y-6 py-4">
      <div className="text-center">
        <h1 className="text-xl font-black text-slate-900">Contactez-nous</h1>
        <p className="text-xs text-slate-500 mt-1">
          Une question, un signalement, un problème avec votre compte ?
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-brand-pink-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-slate-900">Par email</p>
            <a
              href="mailto:mail@ci-kiaba.com"
              className="text-sm text-brand-pink-600 hover:underline font-mono"
            >
              mail@ci-kiaba.com
            </a>
            <p className="text-xs text-slate-500 mt-1">
              Nous répondons généralement sous 24 à 48 heures ouvrées.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-4 border-t border-slate-100">
          <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-slate-900">Signaler une annonce</p>
            <p className="text-xs text-slate-500 mt-1">
              Pour signaler un contenu illégal, une usurpation d&apos;identité ou tout contenu
              contraire à nos conditions générales, écrivez-nous en précisant le lien de
              l&apos;annonce concernée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
