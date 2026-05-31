import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.LEAD_ENGINE_DB ?? "data/db/leads.db";

let _db: Database.Database | null = null;

/**
 * Devuelve la instancia singleton de SQLite.
 * - Crea la carpeta y la DB si no existen.
 * - Aplica el schema si la DB es nueva.
 * - WAL mode para que reads/writes concurrentes no se peleen
 *   (Next.js puede tener varios requests al mismo tiempo).
 */
export function getDb(): Database.Database {
  if (_db) return _db;

  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  applySchema(db);

  _db = db;
  return db;
}

/**
 * Schema de la base de datos.
 *
 * `leads`: una fila por lead procesado. La data del lead + qualification se guardan
 *   como JSON en `input_json` y `qualification_json` para no tener que mapear cada
 *   campo a una columna (evita migraciones cada vez que cambiamos el schema de IA).
 *
 * `lead_states`: el estado actual de cada lead (pendiente/aprobado/rechazado/etc).
 *   Se separa de `leads` para que cambiar de estado sea barato y se pueda auditar.
 *
 * `audit_log`: historial de todas las acciones de Melanie (qué cambió, cuándo).
 *   Sirve para entrenar el sistema después (Fase 3) y para debugging.
 */
function applySchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      apollo_person_id TEXT UNIQUE,
      company_name TEXT NOT NULL,
      contact_name TEXT,
      contact_email TEXT,
      fit_classification TEXT NOT NULL CHECK (fit_classification IN ('Green', 'Yellow', 'Red')),
      score INTEGER NOT NULL,
      is_competitor INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL,
      model TEXT NOT NULL,
      input_json TEXT NOT NULL,
      qualification_json TEXT NOT NULL,
      processed_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_leads_fit ON leads(fit_classification, score DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_name);

    CREATE TABLE IF NOT EXISTS lead_states (
      lead_id INTEGER PRIMARY KEY,
      state TEXT NOT NULL DEFAULT 'pending'
        CHECK (state IN (
          'pending',
          'approved_email',
          'approved_linkedin',
          'approved_both',
          'rejected',
          'wrong_contact',
          'competitor',
          'already_contacted',
          'needs_edit'
        )),
      note TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_states_state ON lead_states(state);

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      from_state TEXT,
      to_state TEXT,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_audit_lead ON audit_log(lead_id, created_at DESC);
  `);
}

/**
 * Cierra la conexión. Útil para tests y scripts puntuales (no para Next.js).
 */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}
