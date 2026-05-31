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

  const repo = await getRepo();
  const lead = await repo.getLeadById(leadId);
  if (!lead) notFound();

  const q = lead.qualification;
  const hasMessages = Boolean(q.suggestedEmail || q.suggestedLinkedinNote);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Volver a la lista
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white border border-zinc-200 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-zinc-900">{lead.companyName}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <FitBadge fit={lead.fitClassification} />
              <span className="text-sm font-medium tabular-nums text-zinc-700">
                Score: {lead.score}/100
              </span>
              <StateBadge state={lead.state} />
              {lead.isCompetitor && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-md font-medium">
                  Marcado como competidor por la IA
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Datos de empresa + contacto */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600 mb-3">Empresa</h3>
          <dl className="space-y-2 text-sm">
            <Field label="Nombre" value={lead.companyName} />
            <Field label="Website" value={lead.input.website} link={lead.input.website ? prefixUrl(lead.input.website) : undefined} />
            <Field label="Industria" value={lead.input.industry} />
            <Field label="Empleados" value={lead.input.employeeCount} />
            <Field label="Ubicación" value={lead.input.companyLocation} />
            <Field label="LinkedIn" value={lead.input.companyLinkedin} link={lead.input.companyLinkedin} />
            {lead.input.companyDescription && (
              <div className="pt-2">
                <dt className="text-xs text-zinc-500">Descripción</dt>
                <dd className="text-sm text-zinc-700 mt-1 leading-relaxed">{lead.input.companyDescription}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600 mb-3">Contacto</h3>
          <dl className="space-y-2 text-sm">
            <Field label="Nombre" value={lead.contactName} />
            <Field label="Título" value={lead.input.contactTitle} />
            <Field label="Email" value={lead.contactEmail} link={lead.contactEmail ? `mailto:${lead.contactEmail}` : undefined} mono />
            <Field label="LinkedIn" value={lead.input.contactLinkedin} link={lead.input.contactLinkedin} />
            <div className="pt-2">
              <dt className="text-xs text-zinc-500">Mejor contacto según IA</dt>
              <dd className="text-sm text-zinc-700 mt-1">{q.bestContactTitle || "—"}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Análisis IA */}
      <section className="bg-white border border-zinc-200 rounded-lg p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600 mb-3">Análisis</h3>
        <dl className="space-y-3 text-sm">
          {q.whyFit && (
            <div>
              <dt className="text-xs text-emerald-700 font-medium">Por qué sí</dt>
              <dd className="text-zinc-700 mt-1 leading-relaxed">{q.whyFit}</dd>
            </div>
          )}
          {q.whyNotFit && (
            <div>
              <dt className="text-xs text-red-700 font-medium">Por qué no</dt>
              <dd className="text-zinc-700 mt-1 leading-relaxed">{q.whyNotFit}</dd>
            </div>
          )}
          {q.recommendedOutreachAngle && (
            <div>
              <dt className="text-xs text-blue-700 font-medium">Ángulo recomendado</dt>
              <dd className="text-zinc-700 mt-1 leading-relaxed">{q.recommendedOutreachAngle}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Mensajes generados */}
      {hasMessages && (
        <section className="bg-white border border-zinc-200 rounded-lg p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600 mb-3">Mensajes generados</h3>
          <div className="space-y-4">
            {q.suggestedEmail && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-900">Email sugerido</span>
                  <CopyButton text={q.suggestedEmail} />
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3 text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                  {q.suggestedEmail}
                </div>
              </div>
            )}
            {q.suggestedLinkedinNote && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-900">Nota LinkedIn</span>
                  <CopyButton text={q.suggestedLinkedinNote} />
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3 text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                  {q.suggestedLinkedinNote}
                </div>
              </div>
            )}
            {q.personalizedFirstLine && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-900">Primera línea personalizada</span>
                  <CopyButton text={q.personalizedFirstLine} />
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3 text-sm text-zinc-700 leading-relaxed">
                  {q.personalizedFirstLine}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Acciones */}
      <section className="bg-white border border-zinc-200 rounded-lg p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600 mb-3">Acciones</h3>
        <ActionButtons leadId={lead.id} currentState={lead.state} />
        {lead.stateNote && (
          <div className="mt-3 text-xs text-zinc-500">
            <span className="font-medium">Nota:</span> {lead.stateNote}
          </div>
        )}
      </section>

      {/* Metadata */}
      <section className="text-xs text-zinc-400 space-y-0.5">
        <div>Procesado: {new Date(lead.processedAt).toLocaleString("es")}</div>
        <div>Modelo: {lead.model}</div>
        <div>Fuente: {lead.source}</div>
      </section>
    </div>
  );
}

interface FieldProps {
  label: string;
  value?: string | null;
  link?: string;
  mono?: boolean;
}

function Field({ label, value, link, mono }: FieldProps) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-xs text-zinc-500 w-24 shrink-0">{label}</dt>
      <dd className={`text-zinc-900 ${mono ? "font-mono text-xs" : ""}`}>
        {value ? (
          link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </dd>
    </div>
  );
}

function prefixUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}
