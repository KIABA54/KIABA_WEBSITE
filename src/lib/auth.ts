import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Doit rester identique à la constante utilisée dans src/middleware.ts :
// le middleware ne peut pas importer ce fichier sans embarquer bcryptjs et
// next/headers dans le bundle Edge, donc le nom du cookie y est dupliqué.
export const SESSION_COOKIE_NAME = "kiaba_session";

const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 jours
const BCRYPT_ROUNDS = 12;

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET n'est pas configuré. Ajoutez une valeur aléatoire longue dans vos variables d'environnement."
    );
  }
  return new TextEncoder().encode(secret);
}

/** Code OTP à 6 chiffres via un générateur cryptographiquement sûr (jamais Math.random, prévisible). */
export function generateOtpCode(): string {
  return randomInt(100000, 1000000).toString();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionPayload {
  userId: string;
  email: string;
}

/**
 * Crée un JWT de session (HS256) et pose le cookie httpOnly correspondant.
 * À appeler uniquement depuis un contexte serveur (Route Handler).
 */
export async function createSession(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return token;
}

/**
 * Lit et vérifie le cookie de session côté serveur.
 * Retourne `null` si absent, expiré ou invalide (ne jette jamais).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
