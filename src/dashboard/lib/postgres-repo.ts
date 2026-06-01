import pg from "pg";
import type { QualifiedLead, LeadInput, Qualification } from "../../types/lead";
import {
  emptyStateCounts,
  type LeadsRepo,
  type LeadRow,
  type LeadState,
  type ListLeadsFilters,
  type LeadStats,
} from "./repo-types";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _schemaReady: Promise<void> | null = null;

/**
 * Pool singleton de Postgres. Reutiliza conexiones entre requests.
 * Supabase requiere SSL.
 */
function getPool(): pg.Pool {
  if (_pool) return _pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL para usar Postgres.");
  }
  _pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
  return _pool;
}

/**
 * Crea el schema si no existe. Se ejecuta una sola vez (memoizado).
 * Equivalente al schema de SQLite pero con tipos Postgres (JSONB, SERIAL, etc.).
 */
function ensureSchema(): Promise<void> {
  if (_schemaReady) return _schemaReady;
  _schemaReady = (async () => {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        apollo_person_id TEXT UNIQUE,
        company_name TEXT NOT NULL,
        contact_name TEXT,
        contact_email TEXT,
        fit_classification TEXT NOT NULL CHECK (fit_classification IN ('Green','Yellow','Red')),
        score INTEGER NOT NULL,
        is_competitor BOOLEAN NOT NULL DEFAULT FALSE,
        source TEXT NOT NULL,
        model TEXT NOT NULL,
        input_json JSONB NOT NULL,
        qualification_json JSONB NOT NULL,
        processed_at TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_leads_fit ON leads(fit_classification, score DESC);
      CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_name);

      CREATE TABLE IF NOT EXISTS lead_states (
        lead_id INTEGER PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
        state TEXT NOT NULL DEFAULT 'pending'
          CHECK (state IN ('pending','approved_email','approved_linkedin','approved_both',
                           'rejected','wrong_contact','competitor','already_contacted','needs_edit')),
        note TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_states_state ON lead_states(state);

      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        from_state TEXT,
        to_state TEXT,
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_lead ON audit_log(lead_id, created_at DESC);
    `);
  })();
  return _schemaReady;
}

interface LeadPgRow {
  id: number;
  apollo_person_id: string | null;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  fit_classification: "Green" | "Yellow" | "Red";
  score: number;
  is_competitor: boolean;
  source: string;
  model: string;
  input_json: LeadInput;
  qualification_json: Qualification;
  processed_at: string;
  created_at: string;
  state: LeadState | null;
  state_note: string | null;
  state_updated_at: string | null;
}

function rowToLead(row: LeadPgRow): LeadRow {
  return {
    id: row.id,
    apolloPersonId: row.apollo_person_id,
    companyName: row.company_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    fitClassification: row.fit_classification,
    score: row.score,
    isCompetitor: row.is_competitor,
    source: row.source,
    model: row.model,
    // pg ya parsea JSONB a objeto, no hace falta JSON.parse
    input: row.input_json,
    qualification: row.qualification_json,
    processedAt: row.processed_at,
    createdAt: typeof row.created_at === "string" ? row.created_at : String(row.created_at),
    state: row.state ?? "pending",
    stateNote: row.state_note,
    stateUpdatedAt: row.state_updated_at ? String(row.state_updated_at) : null,
  };
}

/**
 * Implementación de LeadsRepo sobre Postgres (Supabase).
 * Se usa cuando hay DATABASE_URL configurada (nube).
 */
export class PostgresLeadsRepo implements LeadsRepo {
  async upsertLead(lead: QualifiedLead): Promise<number> {
    await ensureSchema();
    const pool = getPool();
    const apolloPersonId = lead.input.raw?.apollo_person_id ?? null;

    if (apolloPersonId) {
      const existing = await pool.query<{ id: number }>(
        "SELECT id FROM leads WHERE apollo_person_id = $1",
        [apolloPersonId],
      );
      if (existing.rows.length > 0) {
        const id = existing.rows[0].id;
        await pool.query(
          `UPDATE leads SET
             company_name=$1, contact_name=$2, contact_email=$3,
             fit_classification=$4, score=$5, is_competitor=$6,
             source=$7, model=$8, input_json=$9, qualification_json=$10, processed_at=$11
           WHERE id=$12`,
          [
            lead.input.companyName,
            lead.input.contactName ?? null,
            lead.input.contactEmail ?? null,
            lead.qualification.fitClassification,
            lead.qualification.score,
            lead.qualification.isCompetitor,
            lead.input.source,
            lead.model,
            JSON.stringify(lead.input),
            JSON.stringify(lead.qualification),
            lead.processedAt,
            id,
          ],
        );
        return id;
      }
    }

    const inserted = await pool.query<{ id: number }>(
      `INSERT INTO leads (
         apollo_person_id, company_name, contact_name, contact_email,
         fit_classification, score, is_competitor,
         source, model, input_json, qualification_json, processed_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [
        apolloPersonId,
        lead.input.companyName,
        lead.input.contactName ?? null,
        lead.input.contactEmail ?? null,
        lead.qualification.fitClassification,
        lead.qualification.score,
        lead.qualification.isCompetitor,
        lead.input.source,
        lead.model,
        JSON.stringify(lead.input),
        JSON.stringify(lead.qualification),
        lead.processedAt,
      ],
    );

    const leadId = inserted.rows[0].id;
    await pool.query("INSERT INTO lead_states (lead_id, state) VALUES ($1, 'pending')", [leadId]);
    return leadId;
  }

  async listLeads(filters: ListLeadsFilters = {}): Promise<LeadRow[]> {
    await ensureSchema();
    const pool = getPool();
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    // Filtro de fit:
    //  - "all"           → todos (incluye Rojos)
    //  - Green/Yellow/Red → ese color exacto
    //  - undefined/vacío  → default: solo Verdes y Amarillos (la vista de Melanie)
    if (filters.fit === "all") {
      // sin condición: trae los 3 colores
    } else if (filters.fit === "Green" || filters.fit === "Yellow" || filters.fit === "Red") {
      conditions.push(`l.fit_classification = $${p++}`);
      params.push(filters.fit);
    } else {
      conditions.push("l.fit_classification IN ('Green','Yellow')");
    }

    if (filters.state && filters.state !== "all") {
      conditions.push(`COALESCE(s.state, 'pending') = $${p++}`);
      params.push(filters.state);
    }

    const search = filters.search?.trim();
    if (search) {
      conditions.push(`(l.company_name ILIKE $${p} OR l.contact_name ILIKE $${p})`);
      params.push(`%${search}%`);
      p++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filters.limit && filters.limit > 0 ? `LIMIT ${filters.limit}` : "";

    const result = await pool.query<LeadPgRow>(
      `SELECT l.*, s.state, s.note AS state_note, s.updated_at AS state_updated_at
         FROM leads l
         LEFT JOIN lead_states s ON s.lead_id = l.id
         ${where}
         ORDER BY
           CASE l.fit_classification WHEN 'Green' THEN 0 WHEN 'Yellow' THEN 1 ELSE 2 END,
           l.score DESC
         ${limit}`,
      params,
    );
    return result.rows.map(rowToLead);
  }

  async getLeadById(id: number): Promise<LeadRow | null> {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query<LeadPgRow>(
      `SELECT l.*, s.state, s.note AS state_note, s.updated_at AS state_updated_at
         FROM leads l
         LEFT JOIN lead_states s ON s.lead_id = l.id
         WHERE l.id = $1`,
      [id],
    );
    return result.rows.length > 0 ? rowToLead(result.rows[0]) : null;
  }

  async updateLeadState(leadId: number, newState: LeadState, note?: string): Promise<void> {
    await ensureSchema();
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query<{ state: LeadState }>(
        "SELECT state FROM lead_states WHERE lead_id = $1",
        [leadId],
      );
      const fromState = current.rows[0]?.state ?? null;

      await client.query(
        `INSERT INTO lead_states (lead_id, state, note, updated_at)
           VALUES ($1, $2, $3, now())
         ON CONFLICT(lead_id) DO UPDATE SET
           state = EXCLUDED.state, note = EXCLUDED.note, updated_at = EXCLUDED.updated_at`,
        [leadId, newState, note ?? null],
      );
      await client.query(
        `INSERT INTO audit_log (lead_id, action, from_state, to_state, note)
           VALUES ($1, 'state_change', $2, $3, $4)`,
        [leadId, fromState, newState, note ?? null],
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getStats(): Promise<LeadStats> {
    await ensureSchema();
    const pool = getPool();
    const totalRes = await pool.query<{ n: string }>("SELECT COUNT(*) as n FROM leads");
    const total = parseInt(totalRes.rows[0].n, 10);

    const byFitRes = await pool.query<{ fit: "Green" | "Yellow" | "Red"; n: string }>(
      "SELECT fit_classification as fit, COUNT(*) as n FROM leads GROUP BY fit_classification",
    );
    const byFit = { Green: 0, Yellow: 0, Red: 0 };
    for (const row of byFitRes.rows) byFit[row.fit] = parseInt(row.n, 10);

    const byStateRes = await pool.query<{ state: LeadState; n: string }>(
      `SELECT COALESCE(s.state, 'pending') as state, COUNT(*) as n
         FROM leads l LEFT JOIN lead_states s ON s.lead_id = l.id
         GROUP BY COALESCE(s.state, 'pending')`,
    );
    const byState = emptyStateCounts();
    for (const row of byStateRes.rows) byState[row.state] = parseInt(row.n, 10);

    return { total, byFit, byState };
  }
}
