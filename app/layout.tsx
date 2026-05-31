import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { verifySessionToken, SESSION_COOKIE_NAME } from "../src/dashboard/lib/auth";

export const metadata: Metadata = {
  title: "Teilur Lead Engine",
  description: "Sistema interno de calificación y revisión de leads",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isAuthenticated = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return (
    <html lang="es">
      <body>
        <div className="min-h-screen">
          {isAuthenticated && (
            <header className="border-b border-zinc-200 bg-white">
              <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <a href="/" className="block">
                  <h1 className="text-lg font-semibold text-zinc-900">Teilur Lead Engine</h1>
                  <p className="text-xs text-zinc-500">Revisión y aprobación de leads</p>
                </a>
                <form action="/api/logout" method="post">
                  <button
                    type="submit"
                    className="text-xs text-zinc-500 hover:text-zinc-900 border border-zinc-200 rounded-md px-3 py-1.5"
                  >
                    Salir
                  </button>
                </form>
              </div>
            </header>
          )}
          {isAuthenticated ? (
            <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
          ) : (
            children
          )}
        </div>
      </body>
    </html>
  );
}
