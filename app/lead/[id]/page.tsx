import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepo } from "../../../src/dashboard/lib/leads-repo";
import { FitBadge } from "../../../src/dashboard/components/fit-badge";
import { StateBadge } from "../../../src/dashboard/components/state-badge";
import { CopyButton } from "../../../src/dashboard/components/copy-button";
import { ActionButtons } from "../../../src/dashboard/components/action-buttons";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (Number.isNaN(leadId)) notFound();

  const repo = getRepo();
  const lead = await repo.getLeadById(leadId);
  if (!lead) notFound();

  const q = lead.qualification;
  const hasMessages = Boolean(q.suggestedEmail || q.suggestedLinkedinNote);

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="reveal inline-flex items-center gap-1.5 text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Volver a la bandeja
      </Link>

      {/* Encabezado */}
      <header className="reveal" style={{ animationDelay: "40ms" }}>
        <div className="flex flex-wrap items-center gap-2.5 mb-2">
          <FitBadge fit={lead.fitClassification} />
          <StateBadge state={lead.state} />
          {lead.isCompetitor && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--red-bg)] px-2.5 py-1 text-xs font-medium text-[oklch(0.46_0.15_25)]">
              ⚑ Posible competidor
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-4 flex-wrap">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--ink)] leading-none">
            {lead.companyName}
          </h1>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-semibold text-[var(--brand-deep)] tabular-nums">
              {lead.score}
            </span>
            <span className="text-sm text-[var(--ink-faint)]">/ 100</span>
          </div>
        </div>
      </header>

      {/* Grid asimétrico: contenido principal (2fr) + acciones sticky (1fr) */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Columna principal */}
        <div className="space-y-6 min-w-0">
          {/* Análisis */}
          <section className="reveal card p-5 space-y-4" style={{ animationDelay: "80ms" }}>
            <SectionLabel>Por qué este lead</SectionLabel>
            {q.whyFit && (
              <Reason tone="green" title="A favor" text={q.whyFit} />
            )}
            {q.whyNotFit && <Reason tone="red" title="En contra" text={q.whyNotFit} />}
            {q.recommendedOutreachAngle && (
              <Reason tone="brand" title="Ángulo recomendado" text={q.recommendedOutreachAngle} />
            )}
          </section>

          {/* Mensajes */}
          {hasMessages && (
            <section className="reveal space-y-3" style={{ animationDelay: "120ms" }}>
              <SectionLabel>Mensajes listos para enviar</SectionLabel>
              {q.suggestedEmail && (
                <MessageCard title="Cold email" body={q.suggestedEmail} />
              )}
              {q.suggestedLinkedinNote && (
                <MessageCard title="Nota de LinkedIn" body={q.suggestedLinkedinNote} mono={false} />
              )}
              {q.personalizedFirstLine && (
                <MessageCard title="Primera línea" body={q.personalizedFirstLine} compact />
              )}
            </section>
          )}
        </div>

        {/* Sidebar: datos + acciones (sticky) */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          {/* Acciones */}
          <section className="reveal card p-5" style={{ animationDelay: "100ms" }}>
            <SectionLabel>Decisión</SectionLabel>
            <p className="text-xs text-[var(--ink-faint)] mt-1.5 leading-relaxed">
              Marca cómo vas a contactar este lead. No envía nada — copia el mensaje
              de abajo y mándalo tú.
            </p>
            <div className="mt-3">
              <ActionButtons leadId={lead.id} currentState={lead.state} />
            </div>
            {lead.stateNote && (
              <p className="mt-3 text-xs text-[var(--ink-faint)]">Nota: {lead.stateNote}</p>
            )}
          </section>

          {/* Contacto */}
          <section className="reveal card p-5 space-y-3" style={{ animationDelay: "140ms" }}>
            <SectionLabel>Contacto</SectionLabel>
            <Field label="Nombre" value={lead.contactName} />
            <Field label="Título" value={lead.input.contactTitle} />
            <Field
              label="Email"
              value={lead.contactEmail}
              href={lead.contactEmail ? `mailto:${lead.contactEmail}` : undefined}
              copy
            />
            <Field
              label="LinkedIn"
              value={lead.input.contactLinkedin ? "Ver perfil" : undefined}
              href={lead.input.contactLinkedin}
            />
            <Field label="Mejor contacto (IA)" value={q.bestContactTitle} />
          </section>

          {/* Empresa */}
          <section className="reveal card p-5 space-y-3" style={{ animationDelay: "180ms" }}>
            <SectionLabel>Empresa</SectionLabel>
            <Field
              label="Website"
              value={lead.input.website}
              href={lead.input.website ? prefixUrl(lead.input.website) : undefined}
            />
            <Field label="Industria" value={lead.input.industry} />
            <Field label="Empleados" value={lead.input.employeeCount} />
            <Field label="Ubicación" value={lead.input.companyLocation} />
            {lead.input.companyDescription && (
              <div>
                <div className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)] mb-1">
                  Descripción
                </div>
                <p className="text-[13px] text-[var(--ink-soft)] leading-relaxed">
                  {lead.input.companyDescription}
                </p>
              </div>
            )}
          </section>

          <p className="text-[11px] text-[var(--ink-faint)] px-1 leading-relaxed">
            Procesado {new Date(lead.processedAt).toLocaleDateString("es")} · {lead.model} ·{" "}
            {lead.source}
          </p>
        </aside>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
      {children}
    </h2>
  );
}

function Reason({
  tone,
  title,
  text,
}: {
  tone: "green" | "red" | "brand";
  title: string;
  text: string;
}) {
  const color = tone === "green" ? "var(--green)" : tone === "red" ? "var(--red)" : "var(--brand)";
  return (
    <div className="flex gap-3">
      <div className="mt-1.5 h-full w-0.5 rounded-full shrink-0" style={{ background: color }} />
      <div>
        <div className="text-[13px] font-medium" style={{ color }}>
          {title}
        </div>
        <p className="text-sm text-[var(--ink-soft)] leading-relaxed mt-0.5">{text}</p>
      </div>
    </div>
  );
}

function MessageCard({
  title,
  body,
  compact,
}: {
  title: string;
  body: string;
  mono?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <span className="text-[13px] font-medium text-[var(--ink)]">{title}</span>
        <CopyButton text={body} />
      </div>
      <p
        className={`px-4 py-3.5 text-sm text-[var(--ink-soft)] leading-relaxed whitespace-pre-wrap ${
          compact ? "" : ""
        }`}
      >
        {body}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  href,
  copy,
}: {
  label: string;
  value?: string | null;
  href?: string;
  copy?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wide text-[var(--ink-faint)] shrink-0">
        {label}
      </span>
      <span className="text-[13px] text-[var(--ink)] text-right min-w-0 flex items-center gap-1.5">
        {value ? (
          href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand-deep)] hover:underline truncate"
            >
              {value}
            </a>
          ) : (
            <span className="truncate">{value}</span>
          )
        ) : (
          <span className="text-[var(--ink-faint)]">—</span>
        )}
        {copy && value && <CopyButton text={value} compact />}
      </span>
    </div>
  );
}

function prefixUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}
