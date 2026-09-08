import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { checkRateLimit, getClientIp, rateLimitResponseBody } from "@/lib/rateLimit";
import { detectImageMimeType } from "@/lib/imageSignature";

const BUCKET = "kiaba-uploads";
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 Mo
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Upload d'une image (photo de profil ou photo d'annonce) vers Supabase
 * Storage. Toujours via service_role côté serveur : le navigateur n'a
 * jamais de policy d'écriture directe sur le bucket (voir schema.sql).
 *
 * Autorisé sans session UNIQUEMENT pour la photo de profil obligatoire à
 * l'inscription (aucun compte n'existe encore à ce stade). Dans ce cas le
 * fichier est stocké sous `anonymous/` et rate-limité plus strictement par
 * IP. Une fois connecté (ads, changement d'avatar), l'upload est rattaché
 * à l'utilisateur et rate-limité par compte.
 */
export async function POST(req: Request) {
  try {
    const session = await getSession();

    const limit = session
      ? await checkRateLimit(`upload:user:${session.userId}`, 30, 15 * 60)
      : await checkRateLimit(`upload:anon:${getClientIp(req)}`, 5, 15 * 60);
    if (!limit.allowed) {
      return NextResponse.json(rateLimitResponseBody(), { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier reçu (champ 'file' attendu)." }, { status: 400 });
    }

    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: "Format non supporté. Formats acceptés : JPEG, PNG, WEBP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${MAX_FILE_BYTES / (1024 * 1024)} Mo).` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Le Content-Type du client est déclaratif et falsifiable : on vérifie
    // les octets réels du fichier avant de faire confiance à `file.type`.
    const realType = detectImageMimeType(buffer);
    if (!realType || !(realType in ALLOWED_TYPES)) {
      return NextResponse.json(
        { error: "Le contenu du fichier ne correspond pas à une image valide (JPEG, PNG ou WEBP)." },
        { status: 400 }
      );
    }

    const path = `${session ? session.userId : "anonymous"}/${randomUUID()}.${ALLOWED_TYPES[realType]}`;

    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: realType,
      upsert: false,
    });

    if (uploadError) {
      console.error("[Uploads] Échec de l'envoi vers Supabase Storage:", uploadError.message);
      return NextResponse.json({ error: "Erreur lors de l'envoi du fichier." }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ success: true, url: publicUrlData.publicUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
