export const metadata = {
  title: "Conditions générales — KIABA RENCONTRE",
};

const SECTIONS = [
  {
    title: "1. Accès au site",
    body: "KIABA RENCONTRE est réservé exclusivement aux personnes majeures (18 ans révolus). L'accès est soumis à une confirmation d'âge à l'entrée du site.",
  },
  {
    title: "2. Contenu généré par les utilisateurs",
    body: "Les annonces publiées sont rédigées et proposées par leurs auteurs, qui en sont seuls responsables. KIABA RENCONTRE n'intervient pas dans les échanges entre utilisateurs et ne garantit ni l'exactitude ni la licéité des services décrits.",
  },
  {
    title: "3. Modération",
    body: "Un filtre automatique analyse chaque annonce avant sa mise en ligne et bloque tout contenu haineux, raciste, violent ou faisant référence à des mineurs. Toute violation constatée entraîne le retrait immédiat de l'annonce et peut entraîner la suppression du compte.",
  },
  {
    title: "4. Compte et inscription",
    body: "La publication d'une annonce nécessite un compte vérifié par code de confirmation envoyé par email, avec photo de profil obligatoire. Une adresse email ne peut être associée qu'à un seul compte.",
  },
  {
    title: "5. Formules et paiement",
    body: "Les formules de publication (Standard, Pro, Pro (+), VIP) et leurs tarifs sont affichés avant tout paiement. Le règlement s'effectue via un prestataire de paiement tiers sécurisé (Mobile Money et carte bancaire) ; KIABA RENCONTRE ne stocke aucune donnée bancaire.",
  },
  {
    title: "6. Suppression de compte",
    body: "La suppression d'un compte, confirmée par code de sécurité envoyé par email, est irréversible : toutes les annonces et données associées sont purgées. L'adresse email utilisée est alors définitivement exclue de toute nouvelle inscription.",
  },
  {
    title: "7. Modification des présentes conditions",
    body: "Ces conditions peuvent être mises à jour ; la version en vigueur est celle publiée sur cette page.",
  },
];

export default function ConditionsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="text-center">
        <h1 className="text-xl font-black text-slate-900">Conditions générales d&apos;utilisation</h1>
        <p className="text-xs text-slate-500 mt-1">Dernière mise à jour : septembre 2026</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {SECTIONS.map((s) => (
          <div key={s.title} className="p-5">
            <h2 className="text-sm font-extrabold text-brand-blue-900 mb-1.5">{s.title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
