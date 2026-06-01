import Link from "next/link";
import { Suspense } from "react";
import { getRepo } from "../src/dashboard/lib/leads-repo";
import { FitBadge } from "../src/dashboard/components/fit-badge";
import { StateBadge } from "../src/dashboard/components/state-badge";
import { LeadFilters } from "../src/dashboard/components/lead-filters";
import type { LeadState } from "../src/dashboard/lib/repo-types";

export const dynamic = "force-dynamic";

interface SearchParams {
  fit?: string;
  state?: string;
  search?: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Normalizar: strings vacíos → undefined (evita romper el query)
  const fit = params.fit?.trim() || undefined;
  const state = (params.state?.trim() as LeadState | "all" | undefined) || "pending";
  const search = params.search?.trim() || undefined;

  const repo = getRepo();
  const [stats, leads] = await Promise.all([
    repo.getStats(),
    repo.listLeads({ fit: fit as "Green" | "Yellow" | "Red" | "all" | undefined, state, search }),
  ]);

  const pending = stats.byState.pending;
  const approved =
    stats.byState.approved_email + stats.byState.approved_linkedin + stats.byState.approved_both;

  return (
    <div className="space-y-8">
      {/* Encabezado editorial + métrica principal */}
      <header className="reveal flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-[var(--brand)] mb-1">Bandeja de leads</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--ink)] leading-none">
            {pending > 0 ? (
              <>
                <span className="text-[var(--brand-deep)]">{pending}</span> por revisar
              </>
            ) : (
              "Todo al día"
            )}
          </h1>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <Stat label="Verdes" value={stats.byFit.Green} tone="green" />
          <Stat label="Amarillos" value={stats.byFit.Yellow} tone="amber" />
          <Stat label="Aprobados" value={approved} tone="brand" />
        </div>
      </header>

      {/* Filtros */}
      <section
        className="reveal card p-4"
        style={{ animationDelay: "60ms" }}
      >
        <Suspense fallback={<div className="h-12" />}>
          <LeadFilters />
        </Suspense>
      </section>

      {/* Lista */}
      <section className="reveal space-y-2" style={{ animationDelay: "120ms" }}>
        {leads.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[13px] text-[var(--ink-faint)]">
                {leads.length} {leads.length === 1 ? "lead" : "leads"}
              </span>
            </div>
            {leads.map((lead, i) => (
              <Link
                key={lead.id}
                href={`/lead/${lead.id}`}
                className="reveal group card flex items-center gap-4 px-4 py-3.5 transition-all hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)]"
                style={{ animationDelay: `${140 + i * 25}ms` }}
              >
                {/* Score grande a la izquierda */}
                <div className="shrink-0 w-12 text-center">
                  <div className="font-display text-2xl font-semibold tabular-nums text-[var(--ink)] leading-none">
                    {lead.score}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--ink-faint)] mt-0.5">
                    score
                  </div>
                </div>

                <div className="w-px self-stretch bg-[var(--border)]" />

                {/* Empresa + contacto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--ink)] truncate">
                      {lead.companyName}
                    </span>
                    <FitBadge fit={lead.fitClassification} size="sm" />
                  </div>
                  <div className="text-[13px] text-[var(--ink-soft)] truncate mt-0.5">
                    {lead.contactName ?? "Sin contacto"}
                    {lead.input.contactTitle && (
                      <span className="text-[var(--ink-faint)]"> · {lead.input.contactTitle}</span>
                    )}
                  </div>
                </div>

                {/* Email + estado */}
                <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0">
                  <StateBadge state={lead.state} />
                  <span className="text-[12px] text-[var(--ink-faint)]">
                    {lead.contactEmail ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
                        con email
                      </span>
                    ) : (
                      "sin email"
                    )}
                  </span>
                </div>

                <svg
                  className="shrink-0 h-4 w-4 text-[var(--ink-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--brand)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            ))}
          </>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "green" | "amber" | "brand" }) {
  const color =
    tone === "green" ? "var(--green)" : tone === "amber" ? "var(--amber)" : "var(--brand)";
  return (
    <div className="text-right">
      <div className="font-display text-2xl font-semibold tabular-nums leading-none" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)] mt-1">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="mx-auto mb-4 grid place-items-center h-12 w-12 rounded-full bg-[var(--brand-tint)]">
        <svg
          className="h-6 w-6 text-[var(--brand)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <path d="m9 11 3 3L22 4" />
        </svg>
      </div>
      <p className="font-display text-lg font-medium text-[var(--ink)]">
        No hay leads con estos filtros
      </p>
      <p className="text-sm text-[var(--ink-soft)] mt-1 max-w-sm mx-auto">
        Prueba cambiar el filtro de fit o estado. La búsqueda automática trae leads nuevos cada
        mañana.
      </p>
    </div>
  );
}
