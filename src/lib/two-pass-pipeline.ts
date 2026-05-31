import type { LeadInput, QualifiedLead } from "../types/lead.js";
import type { ApolloClient } from "./apollo-client.js";
import type { LeadQualifier } from "./qualifier.js";
import { processLeads } from "./process-leads.js";
import { enrichLead } from "./enrich-lead.js";

export interface TwoPassOptions {
  concurrency: number;
  batchDelayMs: number;
  model: string;
  /**
   * Qué clasificaciones de la pre-calificación se enriquecen.
   * Por defecto: solo Verdes y Amarillos (los Rojos se descartan sin gastar créditos).
   */
  enrichFits?: Array<"Green" | "Yellow" | "Red">;
  /** Callback para reportar progreso en consola. */
  onPhase?: (phase: "pre-qualify" | "enrich" | "re-qualify", info: PhaseInfo) => void;
}

export interface PhaseInfo {
  done?: number;
  total?: number;
  lead?: QualifiedLead;
  enrichmentCalls?: number;
  message?: string;
}

export interface TwoPassResult {
  /** Leads en su estado final (pre-calificados los rojos, re-calificados los verdes/amarillos). */
  leads: QualifiedLead[];
  /** Total de llamadas a endpoints de enriquecimiento (= créditos gastados aprox). */
  totalEnrichmentCalls: number;
}

const DEFAULT_ENRICH_FITS: Array<"Green" | "Yellow" | "Red"> = ["Green", "Yellow"];

/**
 * Pipeline de DOBLE PASADA — la estrategia eficiente para no quemar créditos:
 *
 *   1) PRE-CALIFICAR todos los leads con la data básica que vino de la búsqueda.
 *      No consume créditos de Apollo (solo tokens de IA, que son centavos).
 *
 *   2) ENRIQUECER solo los Verdes y Amarillos (los Rojos se quedan como están).
 *      Aquí sí consume créditos de Apollo, pero solo en los leads que valen la pena.
 *
 *   3) RE-CALIFICAR los enriquecidos con la data completa.
 *      La IA ahora tiene email, industria, tamaño, descripción → score más preciso
 *      y mensajes mucho mejor personalizados.
 *
 * Los Rojos descartados se devuelven con su pre-calificación tal cual.
 */
export async function runTwoPassPipeline(
  leads: LeadInput[],
  apollo: ApolloClient,
  qualifier: LeadQualifier,
  options: TwoPassOptions,
): Promise<TwoPassResult> {
  const enrichFits = new Set(options.enrichFits ?? DEFAULT_ENRICH_FITS);

  // --- FASE 1: TRIAGE rápido (sin generar mensajes — ahorra ~70% de tokens) ---
  options.onPhase?.("pre-qualify", {
    message: `Triage rápido de ${leads.length} leads (sin generar mensajes)...`,
  });
  const preQualified = await processLeads(leads, qualifier, {
    concurrency: options.concurrency,
    batchDelayMs: options.batchDelayMs,
    model: options.model,
    mode: "triage",
    onProgress: (done, total, lead) =>
      options.onPhase?.("pre-qualify", { done, total, lead }),
  });

  // --- FASE 2: enriquecer solo los que valen la pena ---
  const toEnrich = preQualified.filter(
    (q) => !q.error && enrichFits.has(q.qualification.fitClassification),
  );

  options.onPhase?.("enrich", {
    message: `Enriqueciendo ${toEnrich.length} lead(s) (${[...enrichFits].join("/")})...`,
  });

  let totalEnrichmentCalls = 0;
  const enrichedLeads: LeadInput[] = [];
  let enrichDone = 0;

  // Enriquecimiento secuencial — Apollo es estricto con rate limits en estos endpoints
  for (const item of toEnrich) {
    try {
      const result = await enrichLead(item.input, apollo);
      enrichedLeads.push(result.lead);
      totalEnrichmentCalls += result.enrichmentCallsMade;
      enrichDone += 1;
      options.onPhase?.("enrich", {
        done: enrichDone,
        total: toEnrich.length,
        enrichmentCalls: result.enrichmentCallsMade,
        message: result.error ? `(con error: ${result.error})` : undefined,
      });
    } catch (err) {
      // Si falla todo el enriquecimiento, dejamos el lead como estaba
      enrichedLeads.push(item.input);
      enrichDone += 1;
      options.onPhase?.("enrich", {
        done: enrichDone,
        total: toEnrich.length,
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  // --- FASE 3: calificación COMPLETA (con mensajes) de los Verdes/Amarillos ---
  options.onPhase?.("re-qualify", {
    message: `Calificación completa de ${enrichedLeads.length} lead(s) (con mensajes)...`,
  });

  const reQualified = await processLeads(enrichedLeads, qualifier, {
    concurrency: options.concurrency,
    batchDelayMs: options.batchDelayMs,
    model: options.model,
    mode: "full",
    onProgress: (done, total, lead) =>
      options.onPhase?.("re-qualify", { done, total, lead }),
  });

  // --- Combinar: los Rojos descartados quedan con su pre-calificación;
  //     los Verdes/Amarillos se reemplazan con su re-calificación. ---
  const reQualifiedByCompany = new Map<string, QualifiedLead>();
  for (const q of reQualified) {
    reQualifiedByCompany.set(q.input.companyName, q);
  }

  const finalLeads = preQualified.map((q) => {
    if (q.error) return q;
    if (!enrichFits.has(q.qualification.fitClassification)) return q;
    return reQualifiedByCompany.get(q.input.companyName) ?? q;
  });

  return { leads: finalLeads, totalEnrichmentCalls };
}
