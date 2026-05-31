import { GoogleGenAI } from "@google/genai";
import {
  QualificationSchema,
  TriageSchema,
  type LeadInput,
  type Qualification,
  type Triage,
} from "../types/lead.js";
import { SYSTEM_INSTRUCTION, TRIAGE_SYSTEM_INSTRUCTION, buildLeadPrompt } from "./prompt.js";

export interface QualifierOptions {
  apiKey: string;
  model: string;
}

/**
 * Cliente que califica un lead usando Gemini.
 * Encapsula la llamada a la API y la validación del JSON de respuesta.
 */
export class LeadQualifier {
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor(options: QualifierOptions) {
    if (!options.apiKey) {
      throw new Error(
        "Falta GEMINI_API_KEY. Consíguela en https://aistudio.google.com/app/apikey y ponla en el archivo .env",
      );
    }
    this.ai = new GoogleGenAI({ apiKey: options.apiKey });
    this.model = options.model;
  }

  /**
   * Califica COMPLETO un lead (con mensajes generados).
   * Más caro en tokens — solo se debe usar con Verdes/Amarillos.
   */
  async qualify(lead: LeadInput): Promise<Qualification> {
    const text = await this.callModel(lead, SYSTEM_INSTRUCTION);
    const parsed = safeParseJson(text);
    const result = QualificationSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `El JSON de la IA no cumple el esquema completo: ${result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")}`,
      );
    }
    return result.data;
  }

  /**
   * Triage RÁPIDO de un lead (sin mensajes).
   * Devuelve solo fit + score + razón corta + isCompetitor.
   * Ahorra ~70% de tokens vs qualify() porque no genera email/LinkedIn.
   */
  async triage(lead: LeadInput): Promise<Triage> {
    const text = await this.callModel(lead, TRIAGE_SYSTEM_INSTRUCTION);
    const parsed = safeParseJson(text);
    const result = TriageSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `El JSON de la IA no cumple el esquema de triage: ${result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")}`,
      );
    }
    return result.data;
  }

  /**
   * Llamada a la API. Privada — comparte la configuración entre qualify y triage.
   */
  private async callModel(lead: LeadInput, systemInstruction: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: buildLeadPrompt(lead),
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("La IA no devolvió texto en la respuesta.");
    }
    return text;
  }
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(stripCodeFences(text));
  } catch {
    throw new Error(`La IA devolvió un JSON inválido: ${text.slice(0, 200)}`);
  }
}

/**
 * Por si el modelo (a pesar de las instrucciones) envuelve el JSON en ```json ... ```,
 * lo limpiamos para que JSON.parse no falle.
 */
function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  return trimmed;
}
