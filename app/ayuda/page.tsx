import Link from "next/link";
import { FitBadge } from "../../src/dashboard/components/fit-badge";

export const dynamic = "force-dynamic";

export default function HelpPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <header className="reveal">
        <p className="text-[13px] font-medium text-[var(--brand)] mb-1">Guía rápida</p>
        <h1 className="font-display text-3xl font-semibold text-[var(--ink)]">
          Cómo usar el sistema
        </h1>
        <p className="text-[var(--ink-soft)] mt-2 leading-relaxed">
          El sistema busca empresas que están contratando ingenieros, las analiza y te
          prepara todo. Tú solo revisas y decides a quién contactar.
        </p>
      </header>

      {/* Flujo */}
      <section className="reveal card p-6" style={{ animationDelay: "60ms" }}>
        <h2 className="font-display text-lg font-semibold text-[var(--ink)] mb-4">
          El flujo en 3 pasos
        </h2>
        <ol className="space-y-4">
          <Step n={1} title="El sistema trae leads cada mañana">
            Busca decision makers (CEO, CTO, VP de Ingeniería…) en empresas de EE.UU. y
            Canadá que tienen vacantes de ingeniería abiertas. Los califica y descarta
            competidores automáticamente.
          </Step>
          <Step n={2} title="Tú revisas en esta bandeja">
            Cada lead llega con su análisis, su contacto, y mensajes ya redactados. Abres
            uno, lees por qué es buen fit, y decides.
          </Step>
          <Step n={3} title="Copias el mensaje y lo envías tú">
            Marcas cómo lo vas a contactar, copias el email o la nota de LinkedIn, y los
            mandas desde tu cuenta. El sistema lleva el registro.
          </Step>
        </ol>
      </section>

      {/* Colores */}
      <section className="reveal card p-6" style={{ animationDelay: "120ms" }}>
        <h2 className="font-display text-lg font-semibold text-[var(--ink)] mb-4">
          Los colores (qué tan bueno es el lead)
        </h2>
        <div className="space-y-3">
          <ColorRow fit="Green" text="Buen fit. Empresa contratando, decision maker correcto, vale la pena contactar." />
          <ColorRow fit="Yellow" text="Dudoso. Sirve, pero hay algo que revisar (empresa muy grande, señal débil, etc.)." />
          <ColorRow fit="Red" text="No sirve. Competidor o no encaja. El sistema los descarta y no los ves por defecto." />
        </div>
        <p className="text-xs text-[var(--ink-faint)] mt-4">
          El <strong>score (0–100)</strong> es qué tan bueno es el lead. Más alto = mejor.
        </p>
      </section>

      {/* Botones */}
      <section className="reveal card p-6" style={{ animationDelay: "180ms" }}>
        <h2 className="font-display text-lg font-semibold text-[var(--ink)] mb-2">
          Los botones de decisión
        </h2>
        <p className="text-sm text-[var(--ink-soft)] mb-4 leading-relaxed">
          Importante: los botones <strong>solo marcan tu decisión</strong> para llevar
          registro. <strong>No envían correos ni mensajes</strong> — eso lo haces tú
          copiando el texto.
        </p>

        <h3 className="text-[13px] font-semibold text-[var(--ink)] mt-4 mb-2">
          Cuando el lead te sirve
        </h3>
        <div className="space-y-2.5">
          <BtnRow name="Aprobar email + LinkedIn" text="Lo vas a contactar por los dos canales. Copia ambos mensajes." />
          <BtnRow name="Solo email" text="Lo contactas únicamente por correo." />
          <BtnRow name="Solo LinkedIn" text="Lo contactas únicamente por LinkedIn (conexión + mensaje)." />
        </div>

        <h3 className="text-[13px] font-semibold text-[var(--ink)] mt-5 mb-2">
          Cuando lo descartas
        </h3>
        <div className="space-y-2.5">
          <BtnRow name="Ya contactado" text="Ya le escribiste antes. Para no repetir." />
          <BtnRow name="Contacto incorrecto" text="El sistema eligió a la persona equivocada de esa empresa." />
          <BtnRow name="Competidor" text="Es competencia de Teilur. No contactar." />
          <BtnRow name="Rechazar" text="No sirve por otra razón." />
        </div>

        <p className="text-xs text-[var(--ink-faint)] mt-4 leading-relaxed">
          Cada decisión que tomas ayuda a que el sistema aprenda tu criterio con el tiempo.
        </p>
      </section>

      <div className="reveal" style={{ animationDelay: "220ms" }}>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[var(--brand)] hover:bg-[var(--brand-deep)] px-4 py-2.5 rounded-lg transition-colors"
        >
          Ir a la bandeja de leads
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3.5">
      <span className="shrink-0 grid place-items-center h-7 w-7 rounded-full bg-[var(--brand-tint)] text-[var(--brand-deep)] font-display font-semibold text-sm">
        {n}
      </span>
      <div>
        <div className="font-medium text-[var(--ink)]">{title}</div>
        <p className="text-sm text-[var(--ink-soft)] leading-relaxed mt-0.5">{children}</p>
      </div>
    </li>
  );
}

function ColorRow({ fit, text }: { fit: "Green" | "Yellow" | "Red"; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 pt-0.5">
        <FitBadge fit={fit} size="sm" />
      </div>
      <p className="text-sm text-[var(--ink-soft)] leading-relaxed">{text}</p>
    </div>
  );
}

function BtnRow({ name, text }: { name: string; text: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3">
      <span className="shrink-0 text-[13px] font-medium text-[var(--ink)] sm:w-44">{name}</span>
      <span className="text-[13px] text-[var(--ink-soft)] leading-relaxed">{text}</span>
    </div>
  );
}
