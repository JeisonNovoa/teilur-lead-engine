import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import type { QualifiedLead } from "../types/lead.js";
import { getRepo, activeDbEngine } from "../dashboard/lib/leads-repo.js";

/**
 * CLI que importa el JSON generado por `search` a la base de datos local
 * para que el dashboard lo lea.
 *
 * Uso:
 *   npm run ingest                 → toma el JSON más reciente de data/output/
 *   npm run ingest -- <archivo>    → toma un JSON específico
 *
 * Importa solo el archivo de AUDITORÍA (`-todos.json`) si existe, porque
 * incluye todos los leads (incluyendo los Rojos). El dashboard ya filtra
 * los Rojos para Melanie, pero quedan en la DB por trazabilidad.
 */
async function main(): Promise<void> {
  const arg = process.argv[2];
  const path = arg ? arg : await findLatestJson();

  if (!path) {
    console.error("❌ No se encontró ningún JSON en data/output/. Corre primero `npm run search`.");
    process.exit(1);
  }

  if (!existsSync(path)) {
    console.error(`❌ No encontré el archivo: ${path}`);
    process.exit(1);
  }

  console.log(`📥 Importando: ${path}`);
  const content = await readFile(path, "utf-8");

  let leads: QualifiedLead[];
  try {
    leads = JSON.parse(content) as QualifiedLead[];
  } catch (err) {
    console.error(`❌ El archivo no es un JSON válido: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  if (!Array.isArray(leads)) {
    console.error("❌ El JSON debe ser un array de leads.");
    process.exit(1);
  }

  console.log(`✅ ${leads.length} lead(s) en el archivo.`);
  console.log(`🗄️  Base de datos: ${activeDbEngine() === "postgres" ? "Postgres (nube)" : "SQLite (local)"}\n`);

  const repo = await getRepo();
  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (const lead of leads) {
    try {
      const id = await repo.upsertLead(lead);
      imported += 1;
      const tag = lead.qualification.fitClassification;
      const icon = tag === "Green" ? "🟢" : tag === "Yellow" ? "🟡" : "🔴";
      console.log(`  ${icon} #${id}  ${lead.input.companyName} (${tag} ${lead.qualification.score})`);
    } catch (err) {
      errors += 1;
      console.error(
        `  ⚠️  Error con ${lead.input.companyName}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  void updated; // por si en el futuro queremos diferenciar

  console.log("\n──────────── Resumen ────────────");
  console.log(`  📥 Importados:  ${imported}`);
  if (errors > 0) console.log(`  ⚠️  Errores:    ${errors}`);
  console.log("──────────────────────────────────");
  console.log("\n💡 Abre el dashboard con: npm run dashboard");
  console.log("   Luego ve a: http://localhost:3000");
}

/**
 * Busca el JSON de salida más reciente en data/output/.
 * Prefiere el archivo de AUDITORÍA (-todos.json) sobre el de Melanie,
 * porque incluye los Rojos para que la DB tenga el historial completo.
 */
async function findLatestJson(): Promise<string | null> {
  const dir = "data/output";
  if (!existsSync(dir)) return null;

  const files = await readdir(dir);
  const jsons = files
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  if (jsons.length === 0) return null;

  // Buscar primero el -todos.json más reciente
  const todosFile = jsons.find((f) => f.endsWith("-todos.json"));
  if (todosFile) return join(dir, todosFile);

  return join(dir, jsons[0]);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Error fatal:");
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
