import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { stringify } from "csv-stringify/sync";
import type { QualifiedLead } from "../types/lead.js";

/**
 * Ordena los leads para que Melanie vea primero lo más importante:
 * Verde > Amarillo > Rojo, y dentro de cada grupo por score descendente.
 * Los que tuvieron error van al final.
 */
function sortForReview(leads: QualifiedLead[]): QualifiedLead[] {
  const rank: Record<string, number> = { Green: 0, Yellow: 1, Red: 2 };
  return [...leads].sort((a, b) => {
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;
    if (a.error && b.error) return 0;

    const rankA = rank[a.qualification.fitClassification] ?? 3;
    const rankB = rank[b.qualification.fitClassification] ?? 3;
    if (rankA !== rankB) return rankA - rankB;
    return b.qualification.score - a.qualification.score;
  });
}

/**
 * Convierte un QualifiedLead a una fila de CSV legible.
 * `includeMessages` controla si se incluyen las columnas de email/LinkedIn note.
 */
function leadToRow(lead: QualifiedLead, includeMessages: boolean): Record<string, string | number> {
  const row: Record<string, string | number> = {
    Empresa: lead.input.companyName,
    Fit: lead.error ? "ERROR" : lead.qualification.fitClassification,
    Score: lead.error ? "" : lead.qualification.score,
    Competidor: lead.error ? "" : lead.qualification.isCompetitor ? "Sí" : "No",
    "Mejor contacto": lead.error ? "" : lead.qualification.bestContactTitle,
    "Contacto actual": lead.input.contactName ?? "",
    "Título actual": lead.input.contactTitle ?? "",
    Email: lead.input.contactEmail ?? "",
    LinkedIn: lead.input.contactLinkedin ?? "",
    Website: lead.input.website ?? "",
    Industria: lead.input.industry ?? "",
    "# Empleados": lead.input.employeeCount ?? "",
    Ubicación: lead.input.companyLocation ?? "",
    "Por qué sí": lead.error ? "" : lead.qualification.whyFit,
    "Por qué no": lead.error ? "" : lead.qualification.whyNotFit,
  };

  if (includeMessages) {
    row["Ángulo"] = lead.error ? "" : lead.qualification.recommendedOutreachAngle;
    row["Primera línea"] = lead.error ? "" : lead.qualification.personalizedFirstLine;
    row["Email sugerido"] = lead.error ? "" : lead.qualification.suggestedEmail;
    row["Nota LinkedIn"] = lead.error ? "" : lead.qualification.suggestedLinkedinNote;
  }

  row["Fuente"] = lead.input.source;
  if (lead.error) row["Error"] = lead.error;

  return row;
}

/**
 * Escribe DOS pares de archivos:
 *
 *   1) `<base>.csv` y `<base>.json` — PARA MELANIE: solo Verdes y Amarillos
 *      (lo accionable). Incluye los mensajes generados.
 *
 *   2) `<base>-todos.csv` y `<base>-todos.json` — AUDITORÍA: todos los leads
 *      incluyendo Rojos descartados, para verificar que la IA está descartando bien.
 *      No incluye columnas de mensajes para los Rojos (porque no se generaron).
 */
export async function writeResults(
  leads: QualifiedLead[],
  outBasePath: string,
): Promise<{ jsonPath: string; csvPath: string; auditJsonPath: string; auditCsvPath: string }> {
  await mkdir(dirname(outBasePath), { recursive: true });
  const sorted = sortForReview(leads);
  const actionable = sorted.filter(
    (l) => !l.error && l.qualification.fitClassification !== "Red",
  );

  // --- 1. Archivo PRINCIPAL para Melanie: solo Verdes y Amarillos ---
  const jsonPath = `${outBasePath}.json`;
  await writeFile(jsonPath, JSON.stringify(actionable, null, 2), "utf-8");

  const csvPath = `${outBasePath}.csv`;
  const mainRows = actionable.map((lead) => leadToRow(lead, true));
  const mainCsv = stringify(mainRows, { header: true, bom: true });
  await writeFile(csvPath, mainCsv, "utf-8");

  // --- 2. Archivo de AUDITORÍA: todos los leads ---
  const auditJsonPath = `${outBasePath}-todos.json`;
  await writeFile(auditJsonPath, JSON.stringify(sorted, null, 2), "utf-8");

  const auditCsvPath = `${outBasePath}-todos.csv`;
  const auditRows = sorted.map((lead) => leadToRow(lead, true));
  const auditCsv = stringify(auditRows, { header: true, bom: true });
  await writeFile(auditCsvPath, auditCsv, "utf-8");

  return { jsonPath, csvPath, auditJsonPath, auditCsvPath };
}
