import { basename } from "node:path";
import { existsSync } from "node:fs";
import { loadConfig } from "../lib/config.js";
import { readLeadsFromCsv } from "../lib/csv-reader.js";
import { LeadQualifier } from "../lib/qualifier.js";
import { processLeads } from "../lib/process-leads.js";
import { writeResults } from "../lib/results-writer.js";
import type { QualifiedLead } from "../types/lead.js";

/**
 * CLI principal de la Fase 1.
 *
 * Uso:
 *   npm run qualify -- data/input/mi-lista.csv
 *
 * Lee un CSV de Apollo, califica cada lead con Gemini y escribe los resultados
 * en data/output/ (un .csv legible para Melanie y un .json completo).
 */
async function main(): Promise<void> {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error("❌ Falta el archivo de entrada.\n");
    console.error("Uso:  npm run qualify -- data/input/mi-lista.csv\n");
    process.exit(1);
  }

  if (!existsSync(inputPath)) {
    console.error(`❌ No encontré el archivo: ${inputPath}`);
    console.error("   Verifica la ruta. Ejemplo: data/input/leads.csv");
    process.exit(1);
  }

  const config = loadConfig();

  console.log("📥 Leyendo leads del CSV...");
  const leads = await readLeadsFromCsv(inputPath);

  if (leads.length === 0) {
    console.error("❌ No encontré leads válidos en el CSV (revisa que tenga columna de empresa).");
    process.exit(1);
  }

  console.log(`✅ ${leads.length} lead(s) encontrados.`);
  console.log(`🤖 Calificando con ${config.geminiModel} (concurrencia: ${config.concurrency})...\n`);

  const qualifier = new LeadQualifier({
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
  });

  const results = await processLeads(leads, qualifier, {
    concurrency: config.concurrency,
    batchDelayMs: config.batchDelayMs,
    model: config.geminiModel,
    mode: "full",
    onProgress: (doneCount, total, lead) => {
      const tag = lead.error
        ? "⚠️  ERROR"
        : iconFor(lead.qualification.fitClassification);
      const score = lead.error ? "" : ` (${lead.qualification.score})`;
      console.log(`  [${doneCount}/${total}] ${tag}${score}  ${lead.input.companyName}`);
      if (lead.error) console.log(`        └─ ${lead.error}`);
    },
  });

  // Nombre de salida basado en el de entrada + timestamp
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const base = basename(inputPath).replace(/\.csv$/i, "");
  const outBase = `data/output/${base}-calificados-${stamp}`;

  const { jsonPath, csvPath } = await writeResults(results, outBase);

  printSummary(results);
  console.log(`\n📄 Resultados para Melanie (abrir en Excel/Sheets): ${csvPath}`);
  console.log(`🗂️  Resultados completos (JSON): ${jsonPath}`);
}

function iconFor(fit: string): string {
  if (fit === "Green") return "🟢 Verde";
  if (fit === "Yellow") return "🟡 Amarillo";
  return "🔴 Rojo";
}

function printSummary(results: QualifiedLead[]): void {
  const green = results.filter((r) => !r.error && r.qualification.fitClassification === "Green").length;
  const yellow = results.filter((r) => !r.error && r.qualification.fitClassification === "Yellow").length;
  const red = results.filter((r) => !r.error && r.qualification.fitClassification === "Red").length;
  const errors = results.filter((r) => r.error).length;

  console.log("\n──────────── Resumen ────────────");
  console.log(`  🟢 Verdes:    ${green}`);
  console.log(`  🟡 Amarillos: ${yellow}`);
  console.log(`  🔴 Rojos:     ${red}`);
  if (errors > 0) console.log(`  ⚠️  Errores:   ${errors}`);
  console.log("──────────────────────────────────");
}

main().catch((err) => {
  console.error("\n❌ Error fatal:");
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
