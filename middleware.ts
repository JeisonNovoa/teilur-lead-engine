import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "./src/dashboard/lib/auth";

/**
 * Protege todo el dashboard: si no hay sesión válida, redirige a /login.
 * Excepciones: la propia página de login, la API de login, y assets de Next.
 *
 * Corre en runtime Node (no Edge) porque usamos node:crypto para verificar la firma.
 */
export const config = {
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs",
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (verifySessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}
