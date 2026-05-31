import Link from "next/link";
import { getRepo } from "../src/dashboard/lib/leads-repo";
import { FitBadge } from "../src/dashboard/components/fit-badge";
import { StateBadge } from "../src/dashboard/components/state-badge";

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

  const repo = await getRepo();
  const stats = await repo.getStats();
  const leads = await repo.listLeads({
    fit: (params.fit as "Green" | "Yellow" | "Red" | "all" | undefined) ?? undefined,
    state: (params.state as "pending" | "all" | undefined) ?? "pending",
    search: params.search,
  });

  const totalPending = stats.byState.pending;
  const totalGreen = stats.byFit.Green;
  const totalYellow = stats.byFit.Yellow;

  return (
    <div className="space-y-6">
      {/* Hero stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Pendientes" value={totalPending} hint="Sin revisar" />
        <StatCard label="Verdes" value={totalGreen} hint="Listos para contactar" accent="green" />
        <StatCard label="Amarillos" value={totalYellow} hint="Necesitan revisión" accent="yellow" />
        <StatCard label="Total leads" value={stats.total} hint="En la base" />
      </section>

      {/* Filtros */}
      <section className="bg-white border border-zinc-200 rounded-lg p-4">
        <form className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-zinc-600 mb-1">Buscar empresa o contacto</label>
            <input
              type="text"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Ej: Ethernovia"
              className="w-full border border-zinc-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-zinc-300 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-600 mb-1">Fit</label>
            <select
              name="fit"
              defaultValue={params.fit ?? ""}
              className="border border-zinc-300 rounded-md px-3 py-1.5 text-sm"
            >
              <option value="">Verdes y Amarillos</option>
              <option value="Green">Solo Verdes</option>
              <option value="Yellow">Solo Amarillos</option>
              <option value="Red">Solo Rojos (auditoría)</option>
              <option value="all">Todos</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-600 mb-1">Estado</label>
            <select
              name="state"
              defaultValue={params.state ?? "pending"}
              className="border border-zinc-300 rounded-md px-3 py-1.5 text-sm"
            >
              <option value="pending">Pendientes</option>
              <option value="approved_email">Email aprobado</option>
              <option value="approved_linkedin">LinkedIn aprobado</option>
              <option value="approved_both">Ambos aprobados</option>
              <option value="rejected">Rechazados</option>
              <option value="already_contacted">Ya contactado</option>
              <option value="all">Todos</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-zinc-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-zinc-700"
          >
            Aplicar
          </button>
        </form>
      </section>

      {/* Lista de leads */}
      <section className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        {leads.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <p className="text-sm">No hay leads que coincidan con estos filtros.</p>
            <p className="text-xs mt-2">
              ¿No hay leads en la base? Corre <code className="bg-zinc-100 px-1 py-0.5 rounded">npm run search</code> y luego <code className="bg-zinc-100 px-1 py-0.5 rounded">npm run ingest</code>.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Fit</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/lead/${lead.id}`} className="font-medium text-zinc-900 hover:underline">
                      {lead.companyName}
                    </Link>
                    {lead.input.industry && (
                      <div className="text-xs text-zinc-500">{lead.input.industry}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-zinc-900">{lead.contactName ?? "—"}</div>
                    {lead.input.contactTitle && (
                      <div className="text-xs text-zinc-500">{lead.input.contactTitle}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <FitBadge fit={lead.fitClassification} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium tabular-nums">{lead.score}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StateBadge state={lead.state} />
                  </td>
                  <td className="px-4 py-3">
                    {lead.contactEmail ? (
                      <span className="text-xs text-zinc-600 font-mono">{lead.contactEmail}</span>
                    ) : (
                      <span className="text-xs text-zinc-400">Sin email</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/lead/${lead.id}`}
                      className="text-xs text-zinc-600 hover:text-zinc-900"
                    >
                      Abrir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  hint: string;
  accent?: "green" | "yellow";
}

function StatCard({ label, value, hint, accent }: StatCardProps) {
  const accentClass =
    accent === "green"
      ? "text-emerald-700"
      : accent === "yellow"
        ? "text-amber-700"
        : "text-zinc-900";
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <div className="text-xs text-zinc-600">{label}</div>
      <div className={`text-2xl font-semibold mt-1 tabular-nums ${accentClass}`}>{value}</div>
      <div className="text-xs text-zinc-500 mt-0.5">{hint}</div>
    </div>
  );
}
