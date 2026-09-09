import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getUserById, getUserAds } from "@/lib/supabase/queries";
import ProfileDashboard from "@/components/ProfileDashboard";

// Page privée (déjà protégée par le middleware) : pas d'intérêt à la mettre
// en cache ou à la pré-générer, son contenu dépend entièrement de qui est
// connecté.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/connexion?next=/profil");
  }

  const user = await getUserById(session.userId);
  if (!user) {
    redirect("/connexion?next=/profil");
  }

  const ads = await getUserAds(session.userId);

  return <ProfileDashboard initialUser={user} initialAds={ads} />;
}
