import "dotenv/config";
import type { LeadsRepo } from "./repo-types";

// Re-exportamos los tipos para que el resto de la app importe todo desde aquí.
export type {
  LeadsRepo,
  LeadRow,
  LeadState,
  ListLeadsFilters,
  LeadStats,
} from "./repo-types";
export { ALL_STATES } from "./repo-types";

let _repo: LeadsRepo | null = null;

/**
 * Devuelve el repositorio de leads según el entorno (async porque carga el
 * driver de forma diferida):
 *   - Si hay DATABASE_URL  → Postgres (Supabase / nube)
 *   - Si no                → SQLite local (archivo data/db/leads.db)
 *
 * El import dinámico evita cargar 'better-sqlite3' (módulo nativo) en la nube
 * o 'pg' en local cuando no se usan. El resto de la app no sabe cuál corre.
 */
export async function getRepo(): Promise<LeadsRepo> {
  if (_repo) return _repo;

  if (process.env.DATABASE_URL) {
    const { PostgresLeadsRepo } = await import("./postgres-repo");
    _repo = new PostgresLeadsRepo();
  } else {
    const { SqliteLeadsRepo } = await import("./sqlite-repo");
    _repo = new SqliteLeadsRepo();
  }
  return _repo;
}

/** Indica qué motor está activo (para logs / mensajes al usuario). */
export function activeDbEngine(): "postgres" | "sqlite" {
  return process.env.DATABASE_URL ? "postgres" : "sqlite";
}
