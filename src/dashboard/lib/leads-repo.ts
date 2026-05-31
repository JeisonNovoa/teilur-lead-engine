import "dotenv/config";
import type { LeadsRepo } from "./repo-types";
import { PostgresLeadsRepo } from "./postgres-repo";

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
 * Devuelve el repositorio de leads (Postgres / Supabase).
 * Requiere DATABASE_URL configurada — tanto en local (.env) como en Vercel
 * (variables de entorno del proyecto).
 */
export function getRepo(): LeadsRepo {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Falta DATABASE_URL. Ponla en .env (local) o en las variables de entorno de Vercel.\n" +
        "La consigues en Supabase > Connect > Connection string.",
    );
  }
  if (!_repo) _repo = new PostgresLeadsRepo();
  return _repo;
}
