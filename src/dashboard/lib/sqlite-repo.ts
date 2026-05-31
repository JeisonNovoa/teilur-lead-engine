import type { QualifiedLead, LeadInput, Qualification } from "../../types/lead";
import { getDb } from "./db";
import type {
  LeadsRepo,
  LeadRow,
  LeadState,
  ListLeadsFilters,
  LeadStats,
} from "./repo-types";

interface LeadDbRow {
  id: number;
  apollo_person_id: string | null;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  fit_classification: "Green" | "Yellow" | "Red";
  score: number;
  is_competitor: number;
  source: string;
  model: string;
  input_json: string;
  qualification_json: string;
  processed_at: string;
  created_at: string;
  state: LeadState | null;
  state_note: string | null;
  state_updated_at: string | null;
}

function rowToLead(row: LeadDbRow): LeadRow {
  return {
    id: row.id,
    apolloPersonId: row.apollo_person_id,
    companyName: row.company_name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    fitClassification: row.fit_classification,
    score: row.score,
    isCompetitor: row.is_competitor === 1,
    source: row.source,
    model: row.model,
    input: JSON.parse(row.input_json) as LeadInput,
    qualification: JSON.parse(row.qualification_json) as Qualification,
    processedAt: row.processed_at,
    createdAt: row.created_at,
    state: row.state ?? "pending",
    stateNote: row.state_note,
    stateUpdatedAt: row.state_updated_at,
  };
}

/**
 * Implementación de LeadsRepo sobre SQLite (better-sqlite3).
 * Se usa en local / desde los CLIs cuando no hay DATABASE_URL configurada.
 */
export class SqliteLeadsRepo implements LeadsRepo {
  async upsertLead(lead: QualifiedLead): Promise<number> {
    const db = getDb();
    const apolloPersonId = lead.input.raw?.apollo_person_id ?? null;

    const existing = apolloPersonId
      ? (db.prepare("SELECT id FROM leads WHERE apollo_person_id = ?").get(apolloPersonId) as
          | { id: number }
          | undefined)
      : undefined;

    if (existing) {
      db.prepare(
        `UPDATE leads SET
           company_name = ?, contact_name = ?, contact_email = ?,
           fit_classification = ?, score = ?, is_competitor = ?,
           source = ?, model = ?, input_json = ?, qualification_json = ?,
           processed_at = ?
         WHERE id = ?`,
      ).run(
        lead.input.companyName,
        lead.input.contactName ?? null,
        lead.input.contactEmail ?? null,
        lead.qualification.fitClassification,
        lead.qualification.score,
        lead.qualification.isCompetitor ? 1 : 0,
        lead.input.source,
        lead.model,
        JSON.stringify(lead.input),
        JSON.stringify(lead.qualification),
        lead.processedAt,
        existing.id,
      );
      return existing.id;
    }

    const result = db
      .prepare(
        `INSERT INTO leads (
           apollo_person_id, company_name, contact_name, contact_email,
           fit_classification, score, is_competitor,
           source, model, input_json, qualification_json, processed_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        apolloPersonId,
        lead.input.companyName,
        lead.input.contactName ?? null,
        lead.input.contactEmail ?? null,
        lead.qualification.fitClassification,
        lead.qualification.score,
        lead.qualification.isCompetitor ? 1 : 0,
        lead.input.source,
        lead.model,
        JSON.stringify(lead.input),
        JSON.stringify(lead.qualification),
        lead.processedAt,
      );

    const leadId = Number(result.lastInsertRowid);
    db.prepare("INSERT INTO lead_states (lead_id, state) VALUES (?, 'pending')").run(leadId);
    return leadId;
  }

  async listLeads(filters: ListLeadsFilters = {}): Promise<LeadRow[]> {
    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (!filters.fit || filters.fit === "all") {
      conditions.push("l.fit_classification IN ('Green', 'Yellow')");
    } else {
      conditions.push("l.fit_classification = ?");
      params.push(filters.fit);
    }

    if (filters.state && filters.state !== "all") {
      conditions.push("COALESCE(s.state, 'pending') = ?");
      params.push(filters.state);
    }

    if (filters.search) {
      conditions.push("(l.company_name LIKE ? OR l.contact_name LIKE ?)");
      const term = `%${filters.search}%`;
      params.push(term, term);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = filters.limit && filters.limit > 0 ? `LIMIT ${filters.limit}` : "";

    const rows = db
      .prepare(
        `SELECT l.*, s.state, s.note AS state_note, s.updated_at AS state_updated_at
           FROM leads l
           LEFT JOIN lead_states s ON s.lead_id = l.id
           ${where}
           ORDER BY
             CASE l.fit_classification WHEN 'Green' THEN 0 WHEN 'Yellow' THEN 1 ELSE 2 END,
             l.score DESC
           ${limit}`,
      )
      .all(...params) as LeadDbRow[];

    return rows.map(rowToLead);
  }

  async getLeadById(id: number): Promise<LeadRow | null> {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT l.*, s.state, s.note AS state_note, s.updated_at AS state_updated_at
           FROM leads l
           LEFT JOIN lead_states s ON s.lead_id = l.id
           WHERE l.id = ?`,
      )
      .get(id) as LeadDbRow | undefined;
    return row ? rowToLead(row) : null;
  }

  async updateLeadState(leadId: number, newState: LeadState, note?: string): Promise<void> {
    const db = getDb();
    const transaction = db.transaction(() => {
      const current = db
        .prepare("SELECT state FROM lead_states WHERE lead_id = ?")
        .get(leadId) as { state: LeadState } | undefined;

      db.prepare(
        `INSERT INTO lead_states (lead_id, state, note, updated_at)
           VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(lead_id) DO UPDATE SET
           state = excluded.state, note = excluded.note, updated_at = excluded.updated_at`,
      ).run(leadId, newState, note ?? null);

      db.prepare(
        `INSERT INTO audit_log (lead_id, action, from_state, to_state, note)
           VALUES (?, 'state_change', ?, ?, ?)`,
      ).run(leadId, current?.state ?? null, newState, note ?? null);
    });
    transaction();
  }

  async getStats(): Promise<LeadStats> {
    const db = getDb();
    const total = (db.prepare("SELECT COUNT(*) as n FROM leads").get() as { n: number }).n;

    const byFitRows = db
      .prepare("SELECT fit_classification as fit, COUNT(*) as n FROM leads GROUP BY fit_classification")
      .all() as Array<{ fit: "Green" | "Yellow" | "Red"; n: number }>;
    const byFit = { Green: 0, Yellow: 0, Red: 0 };
    for (const row of byFitRows) byFit[row.fit] = row.n;

    const byStateRows = db
      .prepare(
        `SELECT COALESCE(s.state, 'pending') as state, COUNT(*) as n
           FROM leads l LEFT JOIN lead_states s ON s.lead_id = l.id
           GROUP BY COALESCE(s.state, 'pending')`,
      )
      .all() as Array<{ state: LeadState; n: number }>;
    const byState = emptyStateCounts();
    for (const row of byStateRows) byState[row.state] = row.n;

    return { total, byFit, byState };
  }
}

export function emptyStateCounts(): Record<LeadState, number> {
  return {
    pending: 0,
    approved_email: 0,
    approved_linkedin: 0,
    approved_both: 0,
    rejected: 0,
    wrong_contact: 0,
    competitor: 0,
    already_contacted: 0,
    needs_edit: 0,
  };
}
