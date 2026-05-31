import { z } from "zod";

/**
 * Lead de ENTRADA.
 * Representa una empresa/contacto tal como llega desde Apollo (CSV o API)
 * antes de ser calificado por la IA. Los campos son opcionales porque
 * Apollo no siempre devuelve todo.
 */
export const LeadInputSchema = z.object({
  // Empresa
  companyName: z.string().min(1, "El nombre de la empresa es obligatorio"),
  website: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.string().optional(),
  companyLocation: z.string().optional(),
  companyLinkedin: z.string().optional(),
  companyDescription: z.string().optional(),

  // Contacto
  contactName: z.string().optional(),
  contactTitle: z.string().optional(),
  contactEmail: z.string().optional(),
  contactLinkedin: z.string().optional(),

  // Señales de hiring (si vienen en la fuente)
  openRoles: z.string().optional(),
  hiringSignal: z.string().optional(),

  // Metadatos
  source: z.string().default("apollo-csv"),
  // Cualquier campo extra del CSV se guarda aquí sin romper el esquema
  raw: z.record(z.string(), z.string()).optional(),
});

export type LeadInput = z.infer<typeof LeadInputSchema>;

/**
 * Clasificación de fit del lead.
 */
export const FitClassification = z.enum(["Green", "Yellow", "Red"]);
export type FitClassification = z.infer<typeof FitClassification>;

/**
 * Resultado del TRIAGE rápido (sin mensajes generados).
 * Se usa en la pre-calificación para descartar Rojos sin gastar tokens en redacción.
 */
export const TriageSchema = z.object({
  fitClassification: FitClassification,
  score: z.number().min(0).max(100),
  bestContactTitle: z.string(),
  whyFit: z.string(),
  whyNotFit: z.string(),
  isCompetitor: z.boolean(),
});

export type Triage = z.infer<typeof TriageSchema>;

/**
 * Resultado de la calificación COMPLETA.
 * Es exactamente lo que el modelo debe devolver como JSON cuando incluye mensajes.
 */
export const QualificationSchema = TriageSchema.extend({
  recommendedOutreachAngle: z.string(),
  personalizedFirstLine: z.string(),
  suggestedEmail: z.string(),
  suggestedLinkedinNote: z.string(),
});

export type Qualification = z.infer<typeof QualificationSchema>;

/**
 * Lead ya procesado: entrada + resultado de la IA + metadatos de procesamiento.
 * Es lo que se guarda en el archivo de salida para que Melanie lo revise.
 *
 * - Si solo se hizo triage (caso de Rojos), `qualification` cumple con Triage pero
 *   los campos de mensajes (suggestedEmail, etc.) están vacíos.
 * - Si se hizo calificación completa (Verdes/Amarillos), todos los campos están llenos.
 */
export interface QualifiedLead {
  input: LeadInput;
  qualification: Qualification;
  /** Si true, este lead solo pasó por triage (no tiene mensajes generados). */
  triageOnly?: boolean;
  processedAt: string;
  model: string;
  /** Si algo falló al calificar este lead, se registra aquí en vez de tumbar todo. */
  error?: string;
}
