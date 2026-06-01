import { loadConfig } from "../lib/config.js";
import { ApolloClient } from "../lib/apollo-client.js";
import { apolloPeopleToLeads } from "../lib/apollo-mapper.js";
import { LeadQualifier } from "../lib/qualifier.js";
import { runTwoPassPipeline } from "../lib/two-pass-pipeline.js";
import { writeResults } from "../lib/results-writer.js";
import type { QualifiedLead } from "../types/lead.js";

const DEFAULT_MAX_RESULTS = 25;

/**
 * CLI que BUSCA leads en Apollo (con filtros de Teilur) y los CALIFICA con IA, todo en un paso.
 *
 * Uso:
 *   npm run search              → busca 25 leads (default)
 *   npm run search -- 50        → busca 50 leads
 *   npm run search -- 20 --no-enrich  → busca y califica sin enriquecer (sin gastar créditos)
 *   npm run search -- 30 --to-db      → escribe directo a la base de datos (Supabase)
 *                                        en vez de a CSV. Usado por el cron diario.
 *
 * Por defecto usa el pipeline de DOBLE PASADA:
 *   1) Pre-califica todos los leads con la data básica de la búsqueda (gratis)
 *   2) Enriquece SOLO los Verdes y Amarillos (consume créditos de Apollo)
 *   3) Re-califica los enriquecidos con la data completa (mejor scoring + emails)
 * Los Rojos se descartan sin gastar créditos.
 */
async function main(): Promise<void> {
  const { maxResults, enrich, toDb } = parseArgs(process.argv.slice(2));
  const config = loadConfig({ requireApollo: true });

  console.log(`🔎 Buscando hasta ${maxResults} leads en Apollo con los filtros de Teilur...`);
  const apollo = new ApolloClient({ apiKey: config.apolloApiKey });
  const people = await apollo.searchWithDefaults(maxResults);

  if (people.length === 0) {
    console.error("\n❌ Apollo no devolvió personas con los filtros actuales.");
    console.error("   Revisa src/lib/apollo-filters.ts y prueba relajar los filtros.");
    process.exit(1);
  }

  const { leads, skipped } = apolloPeopleToLeads(people);
  console.log(`✅ ${people.length} persona(s) encontradas en Apollo.`);
  if (skipped > 0) console.log(`   (Se saltaron ${skipped} sin empresa asociada.)`);
  console.log(`🤖 Modelo: ${config.geminiModel} | Concurrencia: ${config.concurrency}\n`);

  const qualifier = new LeadQualifier({
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
  });

  let results: QualifiedLead[];
  let creditsUsed = 0;

  if (!enrich) {
    console.log("⚙️  Modo sin enriquecimiento (no se consumen créditos de Apollo).\n");
    const { processLeads } = await import("../lib/process-leads.js");
    results = await processLeads(leads, qualifier, {
      concurrency: config.concurrency,
      batchDelayMs: config.batchDelayMs,
      model: config.geminiModel,
      mode: "full",
      onProgress: (done, total, lead) => printLeadProgress(done, total, lead, "  "),
    });
  } else {
    const pipeline = await runTwoPassPipeline(leads, apollo, qualifier, {
      concurrency: config.concurrency,
      batchDelayMs: config.batchDelayMs,
      model: config.geminiModel,
      onPhase: (phase, info) => printPhaseProgress(phase, info),
    });
    results = pipeline.leads;
    creditsUsed = pipeline.totalEnrichmentCalls;
  }

  printSummary(results, creditsUsed);

  if (toDb) {
    // Modo cron: escribe directo a la base de datos (Supabase).
    const { getRepo } = await import("../dashboard/lib/leads-repo.js");
    const repo = getRepo();
    let saved = 0;
    for (const lead of results) {
      try {
        await repo.upsertLead(lead);
        saved += 1;
      } catch (err) {
        console.error(
          `  ⚠️  No se pudo guardar ${lead.input.companyName}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
    console.log(`\n💾 Guardados ${saved}/${results.length} leads en la base de datos (Supabase).`);
  } else {
    // Modo normal: escribe a CSV/JSON local.
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const outBase = `data/output/apollo-search-${stamp}`;
    const { jsonPath, csvPath, auditJsonPath, auditCsvPath } = await writeResults(results, outBase);
    console.log("\n📄 PARA MELANIE (solo Verdes y Amarillos):");
    console.log(`   CSV:  ${csvPath}`);
    console.log(`   JSON: ${jsonPath}`);
    console.log("\n🔍 AUDITORÍA (incluye Rojos descartados):");
    console.log(`   CSV:  ${auditCsvPath}`);
    console.log(`   JSON: ${auditJsonPath}`);
  }
}

function parseArgs(args: string[]): { maxResults: number; enrich: boolean; toDb: boolean } {
  let maxResults = DEFAULT_MAX_RESULTS;
  let enrich = true;
  let toDb = false;
  for (const arg of args) {
    if (arg === "--no-enrich") enrich = false;
    else if (arg === "--to-db") toDb = true;
    else if (/^\d+$/.test(arg)) maxResults = Math.min(500, parseInt(arg, 10));
    else if (arg.startsWith("--")) console.warn(`⚠️  Flag desconocida: ${arg}`);
    else if (arg.trim()) console.warn(`⚠️  Argumento desconocido: ${arg}`);
  }
  return { maxResults, enrich, toDb };
}

function iconFor(fit: string): string {
  if (fit === "Green") return "🟢 Verde";
  if (fit === "Yellow") return "🟡 Amarillo";
  return "🔴 Rojo";
}

function printLeadProgress(
  done: number,
  total: number,
  lead: QualifiedLead,
  indent = "  ",
): void {
  const tag = lead.error ? "⚠️  ERROR" : iconFor(lead.qualification.fitClassification);
  const score = lead.error ? "" : ` (${lead.qualification.score})`;
  console.log(`${indent}[${done}/${total}] ${tag}${score}  ${lead.input.companyName}`);
  if (lead.error) console.log(`${indent}      └─ ${lead.error}`);
}

function printPhaseProgress(
  phase: "pre-qualify" | "enrich" | "re-qualify",
  info: { done?: number; total?: number; lead?: QualifiedLead; enrichmentCalls?: number; message?: string },
): void {
  if (info.message && info.done === undefined) {
    const phaseLabel = phase === "pre-qualify" ? "📋 Fase 1: Pre-calificación" : phase === "enrich" ? "🔍 Fase 2: Enriquecimiento" : "🎯 Fase 3: Re-calificación";
    console.log(`\n${phaseLabel} — ${info.message}`);
    return;
  }
  if (info.lead && info.done !== undefined && info.total !== undefined) {
    printLeadProgress(info.done, info.total, info.lead, "  ");
    return;
  }
  if (info.done !== undefined && info.total !== undefined) {
    const credits = info.enrichmentCalls ? ` [+${info.enrichmentCalls} crédito(s)]` : "";
    const msg = info.message ? `  ${info.message}` : "";
    console.log(`  [${info.done}/${info.total}]${credits}${msg}`);
  }
}

function printSummary(results: QualifiedLead[], creditsUsed: number): void {
  const green = results.filter((r) => !r.error && r.qualification.fitClassification === "Green").length;
  const yellow = results.filter((r) => !r.error && r.qualification.fitClassification === "Yellow").length;
  const red = results.filter((r) => !r.error && r.qualification.fitClassification === "Red").length;
  const errors = results.filter((r) => r.error).length;
  const withEmail = results.filter((r) => !r.error && r.input.contactEmail).length;

  console.log("\n──────────── Resumen ────────────");
  console.log(`  🟢 Verdes:        ${green}`);
  console.log(`  🟡 Amarillos:     ${yellow}`);
  console.log(`  🔴 Rojos:         ${red}`);
  if (errors > 0) console.log(`  ⚠️  Errores:       ${errors}`);
  console.log(`  📧 Con email:     ${withEmail}/${results.length}`);
  if (creditsUsed > 0) {
    console.log(`  💳 Créditos Apollo: ~${creditsUsed} usados (enriquecimiento)`);
  }
  console.log("──────────────────────────────────");
}

main().catch((err) => {
  console.error("\n❌ Error fatal:");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
