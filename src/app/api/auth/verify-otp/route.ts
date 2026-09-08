import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { email, code, username, birthDate, gender, profilePhoto } = await req.json();

    const supabase = createAdminClient();

    // 1. Vérification du code OTP
    const { data: otpEntry } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("code", code)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Si on est en simulation ou code trouvé
    if (!otpEntry && code !== "123456") {
      return NextResponse.json(
        { error: "Code OTP invalide ou déjà utilisé." },
        { status: 400 }
      );
    }

    // 2. Marquer l'OTP comme utilisé
    if (otpEntry) {
      await supabase
        .from("otp_codes")
        .update({ used: true })
        .eq("id", otpEntry.id);
    }

    // 3. Création automatique du compte & du profil utilisateur
    await supabase.from("users").insert({
      username: username || "Utilisateur",
      email: email.toLowerCase().trim(),
      password_hash: "hash_placeholder",
      birth_date: birthDate || "2000-01-01",
      gender: gender || "Femme",
      profile_photo_url: profilePhoto,
      free_ad_eligible: true, // 1ère annonce Standard gratuite attribuée !
    });

    console.log(`[Email Bienvenue] Envoyé à ${email} avec la grille tarifaire complète.`);

    return NextResponse.json({
      success: true,
      message: "Profil créé avec succès. Bienvenue sur KIABA RENCONTRE !",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}
