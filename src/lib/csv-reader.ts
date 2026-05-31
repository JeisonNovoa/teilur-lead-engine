import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { LeadInputSchema, type LeadInput } from "../types/lead.js";

/**
 * Mapa de posibles nombres de columna de Apollo (y variantes) hacia
 * nuestros campos internos. Apollo a veces cambia los encabezados, así que
 * aceptamos varias variantes. La comparación es case-insensitive y sin espacios.
 */
const COLUMN_ALIASES: Record<keyof Omit<LeadInput, "source" | "raw">, string[]> = {
  companyName: ["company", "company name", "organization name", "account name"],
  website: ["website", "company website", "website url", "url"],
  industry: ["industry", "company industry"],
  employeeCount: ["# employees", "employees", "employee count", "headcount", "company size"],
  companyLocation: ["company location", "company city", "company country", "location"],
  companyLinkedin: ["company linkedin url", "company linkedin"],
  companyDescription: ["company description", "short description", "seo description"],
  contactName: ["name", "full name", "contact name", "first name"],
  contactTitle: ["title", "job title", "contact title"],
  contactEmail: ["email", "email address", "work email"],
  contactLinkedin: ["person linkedin url", "linkedin url", "linkedin"],
  openRoles: ["open roles", "job titles", "roles"],
  hiringSignal: ["hiring signal", "intent", "keywords"],
};

/** Normaliza un encabezado para comparar: minúsculas, sin espacios extra. */
function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Construye un índice {encabezadoNormalizado -> nombreOriginal} para una fila CSV.
 */
function indexHeaders(row: Record<string, string>): Map<string, string> {
  const index = new Map<string, string>();
  for (const original of Object.keys(row)) {
    index.set(normalizeHeader(original), original);
  }
  return index;
}

/**
 * Dado una fila y la lista de alias para un campo, devuelve el primer valor
 * que encuentre. Si no encuentra ninguno, devuelve undefined.
 */
function pickValue(
  row: Record<string, string>,
  headerIndex: Map<string, string>,
  aliases: string[],
): string | undefined {
  for (const alias of aliases) {
    const originalKey = headerIndex.get(normalizeHeader(alias));
    if (originalKey) {
      const value = row[originalKey]?.trim();
      if (value) return value;
    }
  }
  return undefined;
}

/**
 * Lee un CSV exportado de Apollo y lo convierte en una lista de LeadInput.
 * - Tolera columnas faltantes (los campos quedan undefined).
 * - Guarda la fila cruda completa en `raw` por si se necesita después.
 * - Descarta filas sin nombre de empresa (no se pueden calificar).
 */
export async function readLeadsFromCsv(filePath: string): Promise<LeadInput[]> {
  const content = await readFile(filePath, "utf-8");

  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true, // Apollo a veces exporta con BOM
  }) as Record<string, string>[];

  if (rows.length === 0) {
    return [];
  }

  const headerIndex = indexHeaders(rows[0]);
  const leads: LeadInput[] = [];
  const skipped: number[] = [];

  rows.forEach((row, i) => {
    const candidate = {
      companyName: pickValue(row, headerIndex, COLUMN_ALIASES.companyName),
      website: pickValue(row, headerIndex, COLUMN_ALIASES.website),
      industry: pickValue(row, headerIndex, COLUMN_ALIASES.industry),
      employeeCount: pickValue(row, headerIndex, COLUMN_ALIASES.employeeCount),
      companyLocation: pickValue(row, headerIndex, COLUMN_ALIASES.companyLocation),
      companyLinkedin: pickValue(row, headerIndex, COLUMN_ALIASES.companyLinkedin),
      companyDescription: pickValue(row, headerIndex, COLUMN_ALIASES.companyDescription),
      contactName: pickValue(row, headerIndex, COLUMN_ALIASES.contactName),
      contactTitle: pickValue(row, headerIndex, COLUMN_ALIASES.contactTitle),
      contactEmail: pickValue(row, headerIndex, COLUMN_ALIASES.contactEmail),
      contactLinkedin: pickValue(row, headerIndex, COLUMN_ALIASES.contactLinkedin),
      openRoles: pickValue(row, headerIndex, COLUMN_ALIASES.openRoles),
      hiringSignal: pickValue(row, headerIndex, COLUMN_ALIASES.hiringSignal),
      source: "apollo-csv",
      raw: row,
    };

    const result = LeadInputSchema.safeParse(candidate);
    if (result.success) {
      leads.push(result.data);
    } else {
      // Fila sin empresa válida: se salta pero se reporta el número de fila (1-based + encabezado)
      skipped.push(i + 2);
    }
  });

  if (skipped.length > 0) {
    console.warn(
      `[csv-reader] Se saltaron ${skipped.length} fila(s) sin nombre de empresa válido (filas: ${skipped.slice(0, 10).join(", ")}${skipped.length > 10 ? "..." : ""}).`,
    );
  }

  return leads;
}
