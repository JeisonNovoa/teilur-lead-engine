import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { verifySessionToken, SESSION_COOKIE_NAME } from "../src/dashboard/lib/auth";

// Display serif con carácter editorial (no genérico)
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

// Body sans refinada, alternativa a Inter/Roboto
const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Teilur Lead Engine",
  description: "Sistema interno de calificación y revisión de leads",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isAuthenticated = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return (
    <html lang="es" className={`${display.variable} ${sans.variable}`}>
      <body>
        {isAuthenticated ? (
          <div className="min-h-screen">
            <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur-md">
              <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2.5 group">
                  <span className="grid place-items-center h-8 w-8 rounded-lg bg-[var(--brand)] text-white font-display text-lg leading-none">
                    T
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-display text-[15px] font-semibold text-[var(--ink)]">
                      Teilur Lead Engine
                    </span>
                    <span className="text-[11px] text-[var(--ink-faint)] -mt-0.5">
                      Prospección inteligente
                    </span>
                  </span>
                </a>
                <form action="/api/logout" method="post">
                  <button
                    type="submit"
                    className="text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)]"
                  >
                    Salir
                  </button>
                </form>
              </div>
            </header>
            <main className="mx-auto max-w-6xl px-6 py-8 md:py-10">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
