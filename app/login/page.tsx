import { LoginForm } from "../../src/dashboard/components/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel de marca (izquierda) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[var(--brand-deep)] text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="grid place-items-center h-9 w-9 rounded-lg bg-white/15 font-display text-xl">
            T
          </span>
          <span className="font-display text-lg font-semibold">Teilur Lead Engine</span>
        </div>
        <div className="relative">
          <p className="font-display text-3xl font-medium leading-tight max-w-sm">
            Leads calificados, investigados y redactados.
          </p>
          <p className="text-white/70 mt-3 max-w-sm leading-relaxed">
            El sistema encuentra y prepara cada lead. Tú solo decides a quién contactar.
          </p>
        </div>
        <div className="relative text-white/50 text-sm">Prospección nearshore · LATAM → US/CA</div>
      </div>

      {/* Formulario (derecha) */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <span className="grid place-items-center h-9 w-9 rounded-lg bg-[var(--brand)] text-white font-display text-xl">
              T
            </span>
            <span className="font-display text-lg font-semibold text-[var(--ink)]">
              Teilur Lead Engine
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-[var(--ink)]">Bienvenida</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1 mb-6">
            Ingresa para revisar los leads del día.
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
