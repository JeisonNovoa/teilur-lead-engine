import type { LeadInput, QualifiedLead, Qualification } from "../types/lead.js";
import type { LeadQualifier } from "./qualifier.js";

export interface ProcessOptions {
  concurrency: number;
  batchDelayMs: number;
  model: string;
  /** Callback de progreso (para imprimir en consola). */
  onProgress?: (done: number, total: number, lead: QualifiedLead) => void;
}

/** Cuándo cada lead se procesa con triage rápido (sin mensajes) vs con qualify completo. */
export type Mode = "triage" | "full";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Procesa una lista de leads en lotes con concurrencia controlada.
 * - `mode: "triage"` → llamada rápida sin generar mensajes (para pre-calificación).
 * - `mode: "full"` → llamada completa con email + LinkedIn (para Verdes/Amarillos).
 *
 * Si un lead falla, se registra el error en el resultado y se sigue con los demás
 * (un lead malo NO tumba todo el proceso).
 */
export async function processLeads(
  leads: LeadInput[],
  qualifier: LeadQualifier,
  options: ProcessOptions & { mode: Mode },
): Promise<QualifiedLead[]> {
  const results: QualifiedLead[] = [];
  let done = 0;

  for (let i = 0; i < leads.length; i += options.concurrency) {
    const batch = leads.slice(i, i + options.concurrency);

    const batchResults = await Promise.all(
      batch.map(async (lead): Promise<QualifiedLead> => {
        try {
          if (options.mode === "triage") {
            const triage = await qualifier.triage(lead);
            // Mensajes vacíos por ahora — se llenan después si pasa a "full"
            const qualification: Qualification = {
              ...triage,
              recommendedOutreachAngle: "",
              personalizedFirstLine: "",
              suggestedEmail: "",
              suggestedLinkedinNote: "",
            };
            return {
              input: lead,
              qualification,
              triageOnly: true,
              processedAt: new Date().toISOString(),
              model: options.model,
            };
          } else {
            const qualification = await qualifier.qualify(lead);
            return {
              input: lead,
              qualification,
              triageOnly: false,
              processedAt: new Date().toISOString(),
              model: options.model,
            };
          }
        } catch (err) {
          return {
            input: lead,
            qualification: {
              fitClassification: "Red",
              score: 0,
              bestContactTitle: "",
              whyFit: "",
              whyNotFit: "",
              recommendedOutreachAngle: "",
              personalizedFirstLine: "",
              suggestedEmail: "",
              suggestedLinkedinNote: "",
              isCompetitor: false,
            },
            triageOnly: true,
            processedAt: new Date().toISOString(),
            model: options.model,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }),
    );

    for (const result of batchResults) {
      results.push(result);
      done += 1;
      options.onProgress?.(done, leads.length, result);
    }

    if (i + options.concurrency < leads.length && options.batchDelayMs > 0) {
      await sleep(options.batchDelayMs);
    }
  }

  return results;
}
