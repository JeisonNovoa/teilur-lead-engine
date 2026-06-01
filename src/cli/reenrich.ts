import { loadConfig } from "../lib/config.js";
import { ApolloClient } from "../lib/apollo-client.js";
import { enrichLead } from "../lib/enrich-lead.js";
import { LeadQualifier } from "../lib/qualifier.js";
import { getRepo } from "../dashboard/lib/leads-repo.js";
import type { QualifiedLead } from "../types/lead.js";

/**
 * CLI que RE-ENRIQUECE leads ya guardados en la base de datos que tienen
 * datos de empresa faltantes (website, industria, tamaño, etc.).
 *
 * Uso:
 *   npm run reenrich            → re-enriquece todos los leads con datos faltantes
 *   npm run reenrich -- --requalify  → además re-califica con la data nueva
 *
 * Útil para completar leads viejos guardados antes de arreglar el enriquecimiento.
 */
async function main(): Promise<void> {
  const requalify = process.argv.includes("--requalify");
  const config = loadConfig({ requireApollo: true });

  const repo = getRepo();
  const apollo = new ApolloClient({ apiKey: config.apolloApiKey });
  const qualifier = requalify
    ? new LeadQualifier({ apiKey: config.geminiApiKey, model: config.geminiModel })
    : null;

  const allLeads = await repo.listLeads({ fit: "all", state: "all" });

  // Solo los que les falta algún dato de empresa
  const toFix = allLeads.filter(
    (l) =>
      !l.input.website ||
      !l.input.industry ||
      !l.input.employeeCount ||
      !l.input.companyDescription,
  );

  if (toFix.length === 0) {
    console.log("✅ Todos los leads ya tienen datos completos. Nada que hacer.");
    return;
  }

  console.log(`🔧 ${toFix.length} lead(s) con datos faltantes. Re-enriqueciendo...\n`);

  let fixed = 0;
  let credits = 0;
  let failed = 0;

  for (const row of toFix) {
    try {
      const result = await enrichLead(row.input, apollo);
      credits += result.enrichmentCallsMade;

      let qualification = row.qualification;
      if (qualifier && (result.lead.website || result.lead.industry)) {
        // Re-calificar con la data completa para mejorar score y mensajes
        try {
          qualification = await qualifier.qualify(result.lead);
        } catch {
          // Si falla la re-calificación, conservamos la anterior
        }
      }

      const updated: QualifiedLead = {
        input: result.lead,
        qualification,
        processedAt: new Date().toISOString(),
        model: row.model,
      };

      await repo.updateLeadData(row.id, updated);
      fixed += 1;

      const got = [
        result.lead.website ? "web" : null,
        result.lead.industry ? "ind" : null,
        result.lead.employeeCount ? "emp" : null,
      ]
        .filter(Boolean)
        .join(" ");
      console.log(`  ✓ #${row.id} ${row.companyName}  [${got || "sin datos nuevos"}]`);
    } catch (err) {
      failed += 1;
      console.error(
        `  ✗ #${row.id} ${row.companyName}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  console.log("\n──────────── Resumen ────────────");
  console.log(`  ✓ Actualizados: ${fixed}`);
  if (failed > 0) console.log(`  ✗ Fallidos:     ${failed}`);
  console.log(`  💳 Créditos Apollo: ~${credits}`);
  console.log("──────────────────────────────────");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Error fatal:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
