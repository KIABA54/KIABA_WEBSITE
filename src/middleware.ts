import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Doit rester synchronisé avec SESSION_COOKIE_NAME dans src/lib/auth.ts.
// Le middleware tourne dans le runtime Edge et ne peut pas importer ce
// fichier (qui dépend de bcryptjs et de next/headers), d'où la duplication.
const SESSION_COOKIE_NAME = "kiaba_session";

const PROTECTED_PATHS = ["/profil", "/annonces/nouvelle"];
// /annonces/<id>/modifier : id est dynamique, donc pas listable dans
// PROTECTED_PATHS — on protège toute route se terminant par "/modifier".
const PROTECTED_PATH_SUFFIXES = ["/modifier"];

function isProtectedPath(pathname: string): boolean {
  return (
    PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    PROTECTED_PATH_SUFFIXES.some((s) => pathname.endsWith(s))
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret = process.env.SESSION_SECRET;

  if (token && secret) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      return NextResponse.next();
    } catch {
      // Cookie expiré ou invalide : on retombe sur la redirection ci-dessous.
    }
  }

  const loginUrl = new URL("/connexion", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/profil/:path*", "/annonces/nouvelle/:path*", "/annonces/:id/modifier"],
};
