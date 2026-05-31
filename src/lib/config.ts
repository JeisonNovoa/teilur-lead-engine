import "dotenv/config";

/**
 * Lee y valida la configuración desde variables de entorno (.env).
 * Falla temprano con un mensaje claro si falta algo crítico.
 */
export interface Config {
  geminiApiKey: string;
  geminiModel: string;
  apolloApiKey: string;
  concurrency: number;
  batchDelayMs: number;
}

export interface LoadConfigOptions {
  /** Si true, exige que APOLLO_API_KEY esté presente. Por defecto false. */
  requireApollo?: boolean;
}

export function loadConfig(options: LoadConfigOptions = {}): Config {
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  if (!geminiApiKey) {
    throw new Error(
      "Falta GEMINI_API_KEY en el archivo .env.\n" +
        "1. Copia .env.example a .env\n" +
        "2. Consigue tu clave gratis en https://aistudio.google.com/app/apikey\n" +
        "3. Pégala en GEMINI_API_KEY=",
    );
  }

  const apolloApiKey = process.env.APOLLO_API_KEY?.trim() ?? "";
  if (options.requireApollo && !apolloApiKey) {
    throw new Error(
      "Falta APOLLO_API_KEY en el archivo .env.\n" +
        "Consíguela en Apollo > Settings > Integrations > API.\n" +
        "Necesita permiso para 'mixed_people/search' (no consume créditos).",
    );
  }

  return {
    geminiApiKey,
    geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
    apolloApiKey,
    concurrency: clampNumber(process.env.CONCURRENCY, 3, 1, 20),
    batchDelayMs: clampNumber(process.env.BATCH_DELAY_MS, 1000, 0, 60000),
  };
}

function clampNumber(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}
